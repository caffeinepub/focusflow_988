import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import {
  SortBy as BackendSortBy,
  Variant_active_completed,
  Variant_all_today_upcoming,
} from "../backend";

type Project = { id: number; name: string };
export type Priority = "high" | "medium" | "low";
export type ViewFilter = "today" | "upcoming" | "all";
export type SortBy =
  | "dueDate-asc"
  | "dueDate-desc"
  | "priority-asc"
  | "priority-desc"
  | "created-asc"
  | "created-desc"
  | "alpha-asc"
  | "alpha-desc";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  dueDate: number | null;
  priority: Priority;
  projectId: number | null;
  completed: boolean;
  createdAt: number;
};

export type CreateTaskParams = {
  title: string;
  description: string | null;
  dueDate: number | null;
  priority: Priority;
  projectId: number | null;
};

export type TaskFilter = {
  view: ViewFilter;
  projectId: number | null;
  priority: Priority | null;
  status: "active" | "completed" | null;
  searchQuery: string;
  sortBy: SortBy;
};

export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedTasks = {
  items: Task[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function useGetDisplayName() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["displayName"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getDisplayName();
      return result ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProjects() {
  const { actor, isFetching } = useActor();
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllProjects();
      return result.map(
        (p: { id: bigint; name: string }): Project => ({
          id: Number(p.id),
          name: p.name,
        }),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetDisplayName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setDisplayName(name);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["displayName"] });
    },
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createProject(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useRenameProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.renameProject(BigInt(id), name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteProject(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateTaskParams) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createTask(
        params.title,
        params.description ?? null,
        params.dueDate !== null ? BigInt(params.dueDate) : null,
        params.priority,
        params.projectId !== null ? BigInt(params.projectId) : null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

const DEFAULT_PAGE_SIZE = 20;

function sortByToBackend(sortBy: SortBy): BackendSortBy {
  const map: Record<SortBy, BackendSortBy> = {
    "dueDate-asc": BackendSortBy.dueDateAsc,
    "dueDate-desc": BackendSortBy.dueDateDesc,
    "priority-asc": BackendSortBy.priorityAsc,
    "priority-desc": BackendSortBy.priorityDesc,
    "created-asc": BackendSortBy.createdAsc,
    "created-desc": BackendSortBy.createdDesc,
    "alpha-asc": BackendSortBy.alphaAsc,
    "alpha-desc": BackendSortBy.alphaDesc,
  };
  return map[sortBy];
}

export function useGetTasks(filter: TaskFilter, pagination?: PaginationParams) {
  const { actor, isFetching } = useActor();
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? DEFAULT_PAGE_SIZE;

  return useQuery<PaginatedTasks>({
    queryKey: ["tasks", filter, page, limit],
    queryFn: async () => {
      if (!actor)
        return {
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPrevPage: false,
        };
      const result = await actor.getTasks(
        {
          view: filter.view as Variant_all_today_upcoming,
          projectId:
            filter.projectId !== null ? BigInt(filter.projectId) : undefined,
          priority: filter.priority ?? undefined,
          status: filter.status as Variant_active_completed | undefined,
          searchQuery: filter.searchQuery || undefined,
          sortBy: sortByToBackend(filter.sortBy),
        },
        BigInt(page),
        BigInt(limit),
      );
      return {
        items: result.items.map(
          (t: {
            id: bigint;
            title: string;
            description?: string;
            dueDate?: bigint;
            priority: string;
            projectId?: bigint;
            completed: boolean;
            createdAt: bigint;
          }): Task => ({
            id: Number(t.id),
            title: t.title,
            description: t.description ?? null,
            dueDate: t.dueDate !== undefined ? Number(t.dueDate) : null,
            priority: t.priority as Priority,
            projectId: t.projectId !== undefined ? Number(t.projectId) : null,
            completed: t.completed,
            createdAt: Number(t.createdAt),
          }),
        ),
        totalItems: Number(result.totalItems),
        totalPages: Number(result.totalPages),
        currentPage: Number(result.currentPage),
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateTaskParams & { id: number }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateTask(
        BigInt(params.id),
        params.title,
        params.description ?? null,
        params.dueDate !== null ? BigInt(params.dueDate) : null,
        params.priority,
        params.projectId !== null ? BigInt(params.projectId) : null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteTask(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

type TaskQueryData = [queryKey: unknown[], data: PaginatedTasks | undefined];

export function useToggleTaskComplete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Actor not available");
      await actor.toggleTaskComplete(BigInt(id));
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const queries = queryClient.getQueriesData<PaginatedTasks>({
        queryKey: ["tasks"],
      }) as TaskQueryData[];
      queries.forEach(([key, data]: TaskQueryData) => {
        if (data) {
          queryClient.setQueryData(key, {
            ...data,
            items: data.items.map((t: Task) =>
              t.id === id ? { ...t, completed: !t.completed } : t,
            ),
          });
        }
      });
      return { queries };
    },
    onError: (
      _err: unknown,
      _id: number,
      context: { queries: TaskQueryData[] } | undefined,
    ) => {
      context?.queries.forEach(([key, data]: TaskQueryData) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export type TaskExport = {
  id: number;
  title: string;
  description: string | null;
  dueDate: number | null;
  priority: string;
  projectName: string | null;
  completed: boolean;
  createdAt: number;
};

export function useGetTasksForExport() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (filter: TaskFilter): Promise<TaskExport[]> => {
      if (!actor) throw new Error("Actor not available");
      const tasks = await actor.getTasksForExport({
        view: filter.view as Variant_all_today_upcoming,
        projectId:
          filter.projectId !== null ? BigInt(filter.projectId) : undefined,
        priority: filter.priority ?? undefined,
        status: filter.status as Variant_active_completed | undefined,
        searchQuery: filter.searchQuery || undefined,
        sortBy: sortByToBackend(filter.sortBy),
      });
      return tasks.map((t) => ({
        id: Number(t.id),
        title: t.title,
        description: t.description ?? null,
        dueDate: t.dueDate !== undefined ? Number(t.dueDate) : null,
        priority: t.priority,
        projectName: t.projectName ?? null,
        completed: t.completed,
        createdAt: Number(t.createdAt),
      }));
    },
  });
}
