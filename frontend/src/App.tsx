import { useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useActor } from "./hooks/useActor";
import {
  useGetDisplayName,
  useGetProjects,
  useSetDisplayName,
  useCreateProject,
  useRenameProject,
  useDeleteProject,
} from "./hooks/useQueries";
import { useIsMobile } from "./hooks/use-mobile";
import {
  useTaskFiltersContext,
  TaskFiltersProvider,
} from "./hooks/useTaskFilters";
import { toast, Toaster } from "sonner";
import Sidebar from "./components/Sidebar";
import MainView from "./components/MainView";
import ProjectModal from "./components/ProjectModal";
import {
  Menu,
  ClipboardCheck,
  Folder,
  Calendar,
  LogIn,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "./assets/logo.svg";

function AppContent() {
  const { isInitializing, identity, login, loginStatus } =
    useInternetIdentity();
  const { isFetching, actor } = useActor();
  const isMobile = useIsMobile(1024);

  // Queries
  const { data: displayName } = useGetDisplayName();
  const { data: projects = [] } = useGetProjects();

  // Mutations
  const { mutate: updateDisplayName, isPending: isUpdatingDisplayName } =
    useSetDisplayName();
  const { mutate: createProject, isPending: isCreatingProject } =
    useCreateProject();
  const { mutate: renameProject, isPending: isRenamingProject } =
    useRenameProject();
  const { mutate: deleteProject, isPending: isDeletingProject } =
    useDeleteProject();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Error states
  const [projectModalError, setProjectModalError] = useState<string | null>(
    null,
  );
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  // Task filters, sorting, and pagination (shared via context)
  const filters = useTaskFiltersContext();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  // Derive selected project name
  const selectedProjectName =
    filters.selectedProjectId !== null
      ? (projects.find(
          (p: { id: number; name: string }) =>
            p.id === filters.selectedProjectId,
        )?.name ?? null)
      : null;

  const handleProjectSubmit = (name: string, id?: number) => {
    setProjectModalError(null);
    if (id) {
      renameProject(
        { id, name },
        {
          onSuccess: () => {
            setAddProjectModalOpen(false);
            setEditingProject(null);
          },
          onError: (error: unknown) => {
            setProjectModalError(
              error instanceof Error
                ? error.message
                : "Failed to rename project",
            );
          },
        },
      );
    } else {
      createProject(name, {
        onSuccess: (project) => {
          setAddProjectModalOpen(false);
          setEditingProject(null);
          filters.setSelectedProjectId(Number(project.id));
        },
        onError: (error: unknown) => {
          setProjectModalError(
            error instanceof Error ? error.message : "Failed to create project",
          );
        },
      });
    }
  };

  const handleDeleteProject = (id: number) => {
    deleteProject(id, {
      onSuccess: () => {
        if (filters.selectedProjectId === id)
          filters.setSelectedProjectId(null);
      },
      onError: (error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete project",
        );
      },
    });
  };

  const handleUpdateDisplayName = (name: string) => {
    setDisplayNameError(null);
    updateDisplayName(name, {
      onError: (error: unknown) => {
        setDisplayNameError(
          error instanceof Error
            ? error.message
            : "Failed to update display name",
        );
      },
    });
  };

  // Loading while initializing auth
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Loading while creating actor after login
  if (isAuthenticated && isFetching && !actor) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {!isAuthenticated && (
        <div className="flex items-center justify-center min-h-screen px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-12 max-w-lg mx-auto">
            <img
              src={logo}
              alt="FocusFlow"
              className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6"
            />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4 text-center">
              Welcome to FocusFlow
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 text-center">
              Stay organized and focused with simple task management. Sign in
              with Internet Identity to get started and keep your tasks synced
              across all your devices.
            </p>
            <div className="flex justify-center">
              <div className="space-y-4">
                <div className="flex items-center text-left">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-3">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">Never miss a deadline</span>
                </div>
                <div className="flex items-center text-left">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-3">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">
                    Stay focused and productive
                  </span>
                </div>
                <div className="flex items-center text-left">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-3">
                    <Folder className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">
                    Track progress at a glance
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-8 text-center">
              <Button onClick={() => login()} disabled={isLoggingIn} size="lg">
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In with Internet Identity
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="flex min-h-screen overflow-hidden">
          {isMobile && (
            <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border flex items-center px-4 z-30">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="-ml-2"
              >
                <Menu className="w-6 h-6" />
              </Button>
              <img src={logo} alt="FocusFlow" className="w-6 h-6 ml-2" />
              <h1 className="ml-2 text-lg font-bold text-foreground">
                FocusFlow
              </h1>
            </header>
          )}

          <Sidebar
            projects={projects}
            selectedProjectId={filters.selectedProjectId}
            onSelectProject={filters.setSelectedProjectId}
            onAddProject={() => {
              setProjectModalError(null);
              setAddProjectModalOpen(true);
            }}
            onEditProject={(id, name) => {
              setProjectModalError(null);
              setEditingProject({ id, name });
            }}
            onDeleteProject={handleDeleteProject}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            displayName={displayName}
            onUpdateDisplayName={handleUpdateDisplayName}
            isUpdatingDisplayName={isUpdatingDisplayName}
            displayNameError={displayNameError}
            onClearDisplayNameError={() => setDisplayNameError(null)}
            isDeletingProject={isDeletingProject}
          />

          <main
            className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isMobile ? "pt-14" : ""}`}
          >
            <MainView
              filters={filters}
              selectedProjectName={selectedProjectName}
              projects={projects}
            />
          </main>

          <ProjectModal
            open={addProjectModalOpen || !!editingProject}
            onOpenChange={(open) => {
              if (!open) {
                setAddProjectModalOpen(false);
                setEditingProject(null);
                setProjectModalError(null);
              }
            }}
            project={editingProject ?? undefined}
            onSubmit={handleProjectSubmit}
            isLoading={isCreatingProject || isRenamingProject}
            error={projectModalError}
          />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <TaskFiltersProvider>
      <AppContent />
      <Toaster />
    </TaskFiltersProvider>
  );
}
