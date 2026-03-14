import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateTaskParams, Priority } from "../hooks/useQueries";

type Project = { id: number; name: string };

type Task = {
  id: number;
  title: string;
  description: string | null;
  dueDate: number | null;
  priority: Priority;
  projectId: number | null;
};

type TaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSubmit: (params: CreateTaskParams, id?: number) => void;
  isLoading: boolean;
  selectedProjectId: number | null;
  projects: Project[];
  error?: string | null;
};

function formatDateTimeForInput(nanoseconds: number | null): string {
  if (!nanoseconds) return "";
  return format(new Date(nanoseconds / 1_000_000), "yyyy-MM-dd'T'HH:mm");
}

export default function TaskModal({
  open,
  onOpenChange,
  task,
  onSubmit,
  isLoading,
  selectedProjectId,
  projects,
  error,
}: TaskModalProps) {
  const isEditMode = !!task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(
    formatDateTimeForInput(task?.dueDate ?? null),
  );
  const [priority, setPriority] = useState<Priority>(
    task?.priority ?? "medium",
  );
  const [projectId, setProjectId] = useState<number | null>(
    task?.projectId ?? selectedProjectId,
  );

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setDueDate(formatDateTimeForInput(task?.dueDate ?? null));
      setPriority(task?.priority ?? "medium");
      setProjectId(task?.projectId ?? selectedProjectId);
    }
  }, [open, task, selectedProjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit(
      {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? new Date(dueDate).getTime() * 1_000_000 : null,
        priority,
        projectId,
      },
      task?.id,
    );
  };

  const showProjectDropdown = isEditMode || selectedProjectId === null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
              maxLength={255}
              autoFocus
            />
          </div>

          <div>
            <Label className="mb-2">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description (optional)"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <Label className="mb-2">Due Date</Label>
            <Input
              id="task-due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-2">Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showProjectDropdown && projects.length > 0 && (
            <div>
              <Label className="mb-2">Project</Label>
              <Select
                value={projectId !== null ? String(projectId) : "__none__"}
                onValueChange={(v) =>
                  setProjectId(v === "__none__" ? null : Number(v))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      <span className="truncate max-w-[200px] block">
                        {project.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {isEditMode ? "Saving..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Save"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
