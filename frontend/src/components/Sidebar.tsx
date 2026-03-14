import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsMobile } from "../hooks/use-mobile";
import ProfileModal from "./ProfileModal";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Plus,
  List,
  Folder,
  ChevronRight,
  Pencil,
  LogOut,
  MoreVertical,
  Trash2,
  Loader2,
} from "lucide-react";
import logo from "../assets/logo.svg";

type Project = {
  id: number;
  name: string;
};

type SidebarProps = {
  projects: Project[];
  selectedProjectId: number | null;
  onSelectProject: (id: number | null) => void;
  onAddProject: () => void;
  onEditProject: (id: number, name: string) => void;
  onDeleteProject: (id: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  displayName: string | null | undefined;
  onUpdateDisplayName: (name: string) => void;
  isUpdatingDisplayName: boolean;
  displayNameError?: string | null;
  onClearDisplayNameError?: () => void;
  isDeletingProject?: boolean;
};

export default function Sidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onEditProject,
  onDeleteProject,
  isOpen,
  onToggle,
  displayName,
  onUpdateDisplayName,
  isUpdatingDisplayName,
  displayNameError,
  onClearDisplayNameError,
  isDeletingProject,
}: SidebarProps) {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile(1024);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const prevDeletingRef = useRef(false);

  useEffect(() => {
    if (prevDeletingRef.current && !isDeletingProject) {
      setDeleteProjectId(null);
    }
    prevDeletingRef.current = isDeletingProject ?? false;
  }, [isDeletingProject]);

  const principal = identity?.getPrincipal().toString() ?? "";
  const truncatedPrincipal =
    principal.length > 12
      ? `${principal.slice(0, 5)}...${principal.slice(-5)}`
      : principal;

  const handleEditClick = () => {
    onClearDisplayNameError?.();
    setIsEditModalOpen(true);
  };

  const handleSignOut = () => {
    queryClient.clear();
    clear();
  };

  const handleProjectClick = (projectId: number | null) => {
    onSelectProject(projectId);
    if (isMobile) onToggle();
  };

  const handleUpdateDisplayName = (name: string) => {
    onUpdateDisplayName(name);
    setIsEditModalOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border flex items-center gap-3">
        <img src={logo} alt="FocusFlow" className="w-8 h-8" />
        <h1 className="text-xl font-bold text-foreground">FocusFlow</h1>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <Button
          variant="ghost"
          onClick={() => handleProjectClick(null)}
          className={`w-full justify-start space-x-3 px-3 py-2 mb-2 ${
            selectedProjectId === null
              ? "bg-accent text-primary hover:bg-accent"
              : "text-foreground"
          }`}
        >
          <List className="w-5 h-5" />
          <span>All Tasks</span>
        </Button>

        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Projects
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddProject}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Add Project"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {projects.length > 0 ? (
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id} className="group relative">
                <Button
                  variant="ghost"
                  onClick={() => handleProjectClick(project.id)}
                  className={cn(
                    "w-full justify-start space-x-3 px-3 py-2 rounded-none",
                    selectedProjectId === project.id
                      ? "bg-accent text-primary hover:bg-accent"
                      : "text-foreground",
                  )}
                >
                  <Folder className="w-5 h-5" />
                  <span className="truncate flex-1 text-left">
                    {project.name}
                  </span>
                </Button>
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onEditProject(project.id, project.name)}
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteProjectId(project.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-2 text-sm text-muted-foreground italic">
            No projects yet
          </p>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start space-x-3 px-2 py-2 h-auto"
            >
              <Avatar className="bg-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {(displayName || principal).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className="text-foreground text-sm truncate flex-1 text-left"
                title={principal}
              >
                {displayName || truncatedPrincipal}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onClick={handleEditClick}>
              <Pencil className="w-4 h-4" />
              Edit Display Name
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  const modals = (
    <>
      <ProfileModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditModalOpen(false);
            onClearDisplayNameError?.();
          }
        }}
        currentDisplayName={displayName}
        principal={principal}
        onSubmit={handleUpdateDisplayName}
        isLoading={isUpdatingDisplayName}
        error={displayNameError}
      />
      <AlertDialog
        open={deleteProjectId !== null}
        onOpenChange={(open) => !open && setDeleteProjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {projects.find((p) => p.id === deleteProjectId)?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingProject}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 disabled:bg-destructive/50"
              disabled={isDeletingProject}
              onClick={(e) => {
                e.preventDefault();
                if (deleteProjectId !== null) onDeleteProject(deleteProjectId);
              }}
            >
              {isDeletingProject ? (
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
    </>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={onToggle}>
          <SheetContent side="left" className="w-64 p-0 gap-0 flex flex-col">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        {modals}
      </>
    );
  }

  return (
    <>
      <aside className="w-64 bg-white border-r border-border flex flex-col">
        {sidebarContent}
      </aside>
      {modals}
    </>
  );
}
