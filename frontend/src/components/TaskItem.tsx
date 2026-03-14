import { useState, useRef, useEffect } from "react";
import {
  CheckCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Folder,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "../hooks/useQueries";
import { formatDueDate, isOverdue, priorityColors } from "../utils/taskHelpers";

type TaskItemProps = {
  task: Task;
  onToggleComplete: (id: number) => void;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  projectName?: string;
  isDeletingTask?: boolean;
};

export default function TaskItem({
  task,
  onToggleComplete,
  onView,
  onEdit,
  onDelete,
  projectName,
  isDeletingTask,
}: TaskItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const prevDeletingRef = useRef(false);

  useEffect(() => {
    if (prevDeletingRef.current && !isDeletingTask) {
      setConfirmOpen(false);
    }
    prevDeletingRef.current = isDeletingTask ?? false;
  }, [isDeletingTask]);

  const dueText = formatDueDate(task.dueDate);
  const overdue = !task.completed && isOverdue(task.dueDate);

  return (
    <div className="group flex items-center gap-3 p-3 bg-white border border-border rounded-lg hover:border-primary transition-colors">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onToggleComplete(task.id)}
        className={`shrink-0 h-8 w-8 ${
          task.completed ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {task.completed ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" strokeWidth="2" />
          </svg>
        )}
      </Button>

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onView(task)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-medium break-all line-clamp-1 ${
              task.completed
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {task.title}
          </span>
          <Badge variant="outline" className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
          {projectName && (
            <Badge variant="secondary" className="max-w-[120px]">
              <Folder className="w-3 h-3 shrink-0" />
              <span className="truncate">{projectName}</span>
            </Badge>
          )}
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1 break-all">
            {task.description}
          </p>
        )}
        {dueText && (
          <p
            className={`text-sm mt-1 ${overdue ? "text-destructive" : "text-muted-foreground"}`}
          >
            Due: {dueText}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil className="w-4 h-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTask}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 disabled:bg-destructive/50"
              disabled={isDeletingTask}
              onClick={(e) => {
                e.preventDefault();
                onDelete(task.id);
              }}
            >
              {isDeletingTask ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
