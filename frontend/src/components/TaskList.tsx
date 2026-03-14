import TaskItem from "./TaskItem";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { Task } from "../hooks/useQueries";
import type { StatusFilter } from "./TaskControls";

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

type Project = { id: number; name: string };

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
};

type TaskListProps = {
  tasks: Task[];
  projects: Project[];
  onToggleComplete: (id: number) => void;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  statusFilter: StatusFilter;
  isLoading: boolean;
  isDeletingTask?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  pagination?: PaginationProps;
};

export default function TaskList({
  tasks,
  projects,
  onToggleComplete,
  onView,
  onEdit,
  onDelete,
  statusFilter,
  isLoading,
  isDeletingTask,
  hasActiveFilters,
  onClearFilters,
  pagination,
}: TaskListProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const showSeparator =
    statusFilter === "all" &&
    activeTasks.length > 0 &&
    completedTasks.length > 0;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          {hasActiveFilters ? "No tasks match your filters" : "No tasks yet"}
        </p>
        {hasActiveFilters && onClearFilters ? (
          <Button variant="link" onClick={onClearFilters} className="mt-3">
            Clear filters
          </Button>
        ) : (
          !hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-1">
              Create a task to get started
            </p>
          )
        )}
      </div>
    );
  }

  const renderTaskItem = (task: Task) => (
    <TaskItem
      key={task.id}
      task={task}
      onToggleComplete={onToggleComplete}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      projectName={
        task.projectId !== null ? projectMap.get(task.projectId) : undefined
      }
      isDeletingTask={isDeletingTask}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {activeTasks.map(renderTaskItem)}

        {showSeparator && (
          <div className="col-span-full flex items-center gap-3 py-2">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Completed
            </span>
            <Separator className="flex-1" />
          </div>
        )}

        {completedTasks.map(renderTaskItem)}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination className="py-3">
          <PaginationContent>
            {getPageNumbers(pagination.currentPage, pagination.totalPages).map(
              (page, i) => (
                <PaginationItem key={i}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => pagination.onPageChange(page)}
                      isActive={pagination.currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ),
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
