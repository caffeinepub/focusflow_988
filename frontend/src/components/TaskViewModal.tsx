import { Pencil, Folder, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Task } from "../hooks/useQueries";
import { formatDueDate, isOverdue, priorityColors } from "../utils/taskHelpers";

type TaskViewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  projectName?: string;
  onEdit: () => void;
};

export default function TaskViewModal({
  open,
  onOpenChange,
  task,
  projectName,
  onEdit,
}: TaskViewModalProps) {
  const dueText = task ? formatDueDate(task.dueDate) : null;
  const overdue = task ? !task.completed && isOverdue(task.dueDate) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {task && (
          <>
            <DialogHeader className="pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle
                  className={`${task.completed ? "text-muted-foreground line-through" : ""} shrink-0`}
                >
                  {task.title.length > 20
                    ? task.title.slice(0, 20) + "..."
                    : task.title}
                </DialogTitle>
                <Badge
                  variant="secondary"
                  className={
                    task.completed
                      ? "bg-success/10 text-success"
                      : "bg-accent text-primary"
                  }
                >
                  {task.completed ? "Completed" : "Active"}
                </Badge>
                <Badge
                  variant="outline"
                  className={priorityColors[task.priority]}
                >
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </Badge>
                {projectName && (
                  <Badge variant="secondary" className="max-w-[120px]">
                    <Folder className="w-3 h-3 shrink-0" />
                    <span className="truncate">{projectName}</span>
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {dueText && (
              <div
                className={`flex items-center gap-2 mb-4 text-sm ${overdue ? "text-destructive" : "text-muted-foreground"}`}
              >
                <Calendar className="w-4 h-4" />
                <span>Due: {dueText}</span>
                {overdue && <Badge variant="destructive">Overdue</Badge>}
              </div>
            )}

            {task.description ? (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-all">
                  {task.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic mb-6">
                No description
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button className="flex-1" onClick={onEdit}>
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
