import { useState, useEffect } from "react";
import { User, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDisplayName: string | null | undefined;
  principal: string;
  onSubmit: (displayName: string) => void;
  isLoading: boolean;
  error?: string | null;
};

export default function ProfileModal({
  open,
  onOpenChange,
  currentDisplayName,
  principal,
  onSubmit,
  isLoading,
  error,
}: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName || "");

  useEffect(() => {
    if (open) {
      setDisplayName(currentDisplayName || "");
    }
  }, [open, currentDisplayName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      onSubmit(displayName.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Edit Profile</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Principal ID
          </p>
          <p className="text-sm text-foreground font-mono break-all">
            {principal}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="mb-2">Display Name</Label>
            <Input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              required
              maxLength={50}
              autoFocus
            />
            <p className="mt-1 text-sm text-muted-foreground">
              This name will be displayed in the sidebar.
            </p>
          </div>

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
              disabled={isLoading || !displayName.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
