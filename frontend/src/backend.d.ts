import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    id: bigint;
    title: string;
    owner: Principal;
    createdAt: bigint;
    completed: boolean;
    dueDate?: bigint;
    description?: string;
    updatedAt: bigint;
    projectId?: bigint;
    priority: string;
}
export interface PaginationResult {
    currentPage: bigint;
    items: Array<Task>;
    totalPages: bigint;
    totalItems: bigint;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
export interface TaskFilter {
    status?: Variant_active_completed;
    sortBy?: SortBy;
    view?: Variant_all_today_upcoming;
    projectId?: bigint;
    priority?: string;
    searchQuery?: string;
}
export interface TaskExport {
    id: bigint;
    title: string;
    projectName?: string;
    createdAt: bigint;
    completed: boolean;
    dueDate?: bigint;
    description?: string;
    priority: string;
}
export interface Project {
    id: bigint;
    owner: Principal;
    name: string;
    createdAt: bigint;
}
export enum SortBy {
    dueDateDesc = "dueDateDesc",
    alphaAsc = "alphaAsc",
    priorityDesc = "priorityDesc",
    createdDesc = "createdDesc",
    createdAsc = "createdAsc",
    alphaDesc = "alphaDesc",
    priorityAsc = "priorityAsc",
    dueDateAsc = "dueDateAsc"
}
export enum Variant_active_completed {
    active = "active",
    completed = "completed"
}
export enum Variant_all_today_upcoming {
    all = "all",
    today = "today",
    upcoming = "upcoming"
}
export interface backendInterface {
    createProject(name: string): Promise<Project>;
    createTask(title: string, description: string | null, dueDate: bigint | null, priority: string, projectId: bigint | null): Promise<Task>;
    deleteProject(id: bigint): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    getAllProjects(): Promise<Array<Project>>;
    getDisplayName(): Promise<string | null>;
    getTasks(filter: TaskFilter, page: bigint | null, limit: bigint | null): Promise<PaginationResult>;
    getTasksForExport(filter: TaskFilter): Promise<Array<TaskExport>>;
    renameProject(id: bigint, name: string): Promise<Project>;
    setDisplayName(displayName: string): Promise<void>;
    toggleTaskComplete(id: bigint): Promise<Task>;
    updateTask(id: bigint, title: string, description: string | null, dueDate: bigint | null, priority: string, projectId: bigint | null): Promise<Task>;
}
