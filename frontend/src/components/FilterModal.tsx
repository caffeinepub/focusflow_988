import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Priority } from "../hooks/useQueries";

type StatusFilter = "all" | "active" | "completed";

type FilterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priorityFilter: Priority | null;
  statusFilter: StatusFilter;
  onApply: (priority: Priority | null, status: StatusFilter) => void;
};

const priorityOptions: { value: Priority | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export default function FilterModal({
  open,
  onOpenChange,
  priorityFilter,
  statusFilter,
  onApply,
}: FilterModalProps) {
  const [priority, setPriority] = useState<Priority | null>(priorityFilter);
  const [status, setStatus] = useState<StatusFilter>(statusFilter);

  useEffect(() => {
    if (open) {
      setPriority(priorityFilter);
      setStatus(statusFilter);
    }
  }, [open, priorityFilter, statusFilter]);

  const handleClear = () => {
    onApply(null, "all");
    onOpenChange(false);
  };

  const handleDone = () => {
    onApply(priority, status);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <Label className="mb-2">Priority</Label>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map((option) => (
              <Button
                key={String(option.value)}
                variant={priority === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <Label className="mb-2">Status</Label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={status === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={handleClear}>
            Clear
          </Button>
          <Button className="flex-1" onClick={handleDone}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { StatusFilter };
