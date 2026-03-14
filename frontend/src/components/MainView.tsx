import { useState } from "react";
import { format } from "date-fns";
import TaskToolbar from "./TaskToolbar";
import TaskControls from "./TaskControls";
import TaskModal from "./TaskModal";
import TaskViewModal from "./TaskViewModal";
import TaskList from "./TaskList";
import { toast } from "sonner";
import { type TaskFilters } from "../hooks/useTaskFilters";
import {
  useCreateTask,
  useGetTasks,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskComplete,
  useGetTasksForExport,
  type CreateTaskParams,
  type Task,
  type TaskExport,
} from "../hooks/useQueries";

type Project = { id: number; name: string };

type MainViewProps = {
  filters: TaskFilters;
  selectedProjectName: string | null;
  projects: Project[];
};

export default function MainView({
  filters,
  selectedProjectName,
  projects,
}: MainViewProps) {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);

  const { data: tasksData, isLoading } = useGetTasks(filters.apiFilter, {
    page: filters.currentPage,
    limit: 20,
  });
  const tasks = tasksData?.items ?? [];

  const { mutate: createTask, isPending: isCreatingTask } = useCreateTask();
  const { mutate: updateTask, isPending: isUpdatingTask } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask();
  const { mutate: toggleComplete } = useToggleTaskComplete();
  const { mutate: getTasksForExport, isPending: isExporting } =
    useGetTasksForExport();

  const title = selectedProjectName ?? "All Tasks";

  const handleTaskSubmit = (params: CreateTaskParams, id?: number) => {
    setTaskModalError(null);
    if (id !== undefined) {
      updateTask(
        { ...params, id },
        {
          onSuccess: () => {
            setEditingTask(null);
            setTaskModalOpen(false);
          },
          onError: (error: unknown) => {
            setTaskModalError(
              error instanceof Error ? error.message : "Failed to update task",
            );
          },
        },
      );
    } else {
      createTask(params, {
        onSuccess: () => setTaskModalOpen(false),
        onError: (error: unknown) => {
          setTaskModalError(
            error instanceof Error ? error.message : "Failed to create task",
          );
        },
      });
    }
  };

  const handleView = (task: Task) => {
    setViewingTask(task);
  };

  const handleEdit = (task: Task) => {
    setViewingTask(null);
    setEditingTask(task);
    setTaskModalError(null);
    setTaskModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteTask(id, {
      onError: () => {
        toast.error("Failed to delete task");
      },
    });
  };

  const handleToggleComplete = (id: number) => {
    const task = tasks.find((t: Task) => t.id === id);
    if (task && !task.completed) {
      toast.success("Task completed");
    } else {
      toast.success("Task marked incomplete");
    }
    toggleComplete(id, {
      onError: () => {
        toast.error("Failed to update task");
      },
    });
  };

  const handleCloseModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
    setTaskModalError(null);
  };

  const handleExport = () => {
    getTasksForExport(filters.apiFilter, {
      onSuccess: (tasks: TaskExport[]) => {
        if (tasks.length === 0) {
          toast.error("No tasks to export");
          return;
        }

        const escapeCSV = (str: string) => {
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const formatDate = (nanos: number | null) => {
          if (!nanos) return "";
          return format(new Date(nanos / 1_000_000), "yyyy-MM-dd HH:mm:ss");
        };

        let csv =
          "id,title,description,dueDate,priority,project,completed,createdAt\n";
        for (const task of tasks) {
          csv +=
            [
              task.id,
              escapeCSV(task.title),
              escapeCSV(task.description ?? ""),
              formatDate(task.dueDate),
              task.priority,
              escapeCSV(task.projectName ?? ""),
              task.completed ? "Yes" : "No",
              formatDate(task.createdAt),
            ].join(",") + "\n";
        }

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tasks.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Tasks exported");
      },
      onError: () => {
        toast.error("Failed to export tasks");
      },
    });
  };

  return (
    <div className="flex-1 px-4 py-4 overflow-hidden">
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        <h1 className="text-2xl font-bold text-foreground truncate w-full">
          {title}
        </h1>

        <TaskToolbar
          onExport={handleExport}
          isExporting={isExporting}
          exportDisabled={tasks.length === 0}
          onAddTask={() => {
            setTaskModalError(null);
            setTaskModalOpen(true);
          }}
        />

        <TaskControls />

        <TaskList
          tasks={tasks}
          projects={projects}
          onToggleComplete={handleToggleComplete}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          statusFilter={filters.statusFilter}
          isLoading={isLoading}
          isDeletingTask={isDeletingTask}
          hasActiveFilters={filters.hasActiveFilters}
          onClearFilters={filters.clearFilters}
          pagination={
            tasksData
              ? {
                  currentPage: tasksData.currentPage,
                  totalPages: tasksData.totalPages,
                  totalItems: tasksData.totalItems,
                  hasNextPage: tasksData.hasNextPage,
                  hasPrevPage: tasksData.hasPrevPage,
                  onPageChange: filters.setCurrentPage,
                }
              : undefined
          }
        />
      </div>

      <TaskModal
        open={taskModalOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
        task={
          editingTask
            ? {
                id: editingTask.id,
                title: editingTask.title,
                description: editingTask.description,
                dueDate: editingTask.dueDate,
                priority: editingTask.priority,
                projectId: editingTask.projectId,
              }
            : undefined
        }
        onSubmit={handleTaskSubmit}
        isLoading={isCreatingTask || isUpdatingTask}
        selectedProjectId={filters.selectedProjectId}
        projects={projects}
        error={taskModalError}
      />

      <TaskViewModal
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
        task={viewingTask}
        projectName={
          viewingTask?.projectId !== null
            ? projects.find((p) => p.id === viewingTask?.projectId)?.name
            : undefined
        }
        onEdit={() => viewingTask && handleEdit(viewingTask)}
      />
    </div>
  );
}
