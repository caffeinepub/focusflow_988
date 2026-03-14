import { useState, useEffect } from "react";
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

type ProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: { id: number; name: string };
  onSubmit: (name: string, id?: number) => void;
  isLoading: boolean;
  error?: string | null;
};

export default function ProjectModal({
  open,
  onOpenChange,
  project,
  onSubmit,
  isLoading,
  error,
}: ProjectModalProps) {
  const isEditMode = !!project;
  const [projectName, setProjectName] = useState(project?.name ?? "");

  useEffect(() => {
    if (open) {
      setProjectName(project?.name ?? "");
    }
  }, [open, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = projectName.trim();
    if (!trimmedName) return;
    if (isEditMode && trimmedName === project.name) return;

    onSubmit(trimmedName, project?.id);
  };

  const isDisabled = isEditMode
    ? !projectName.trim() || projectName.trim() === project.name
    : !projectName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
            required
            maxLength={100}
            autoFocus
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
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
              disabled={isLoading || isDisabled}
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
