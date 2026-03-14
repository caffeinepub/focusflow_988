import {
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { TimeFilter } from "../components/TaskToolbar";
import type {
  Priority,
  StatusFilter,
  SortOption,
} from "../components/TaskControls";
import type { ViewFilter } from "./useQueries";

export interface ApiFilter {
  view: ViewFilter;
  projectId: number | null;
  priority: Priority | null;
  status: "active" | "completed" | null;
  searchQuery: string;
  sortBy: SortOption;
}

export interface TaskFilters {
  activeFilter: TimeFilter;
  selectedProjectId: number | null;
  searchQuery: string;
  priorityFilter: Priority | null;
  statusFilter: StatusFilter;
  sortBy: SortOption;
  currentPage: number;

  // Computed
  hasActiveFilters: boolean;
  apiFilter: ApiFilter;

  setActiveFilter: (filter: TimeFilter) => void;
  setSelectedProjectId: (id: number | null) => void;
  setSearchQuery: (query: string) => void;
  setPriorityFilter: (priority: Priority | null) => void;
  setStatusFilter: (status: StatusFilter) => void;
  setSortBy: (sort: SortOption) => void;
  setCurrentPage: (page: number) => void;
  resetPage: () => void;
  clearFilters: () => void;
}

/**
 * Custom hook to manage all task filtering, sorting, and pagination state.
 * Automatically resets to page 1 when any filter changes.
 */
export function useTaskFilters(): TaskFilters {
  const [activeFilter, setActiveFilterState] = useState<TimeFilter>("all");
  const [selectedProjectId, setSelectedProjectIdState] = useState<
    number | null
  >(null);
  const [searchQuery, setSearchQueryState] = useState("");
  const [priorityFilter, setPriorityFilterState] = useState<Priority | null>(
    null,
  );
  const [statusFilter, setStatusFilterState] = useState<StatusFilter>("all");
  const [sortBy, setSortByState] = useState<SortOption>("dueDate-asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Helper to create setters that auto-reset page
  const withPageReset = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => {
      return (value: T) => {
        setCurrentPage(1);
        setter(value);
      };
    },
    [],
  );

  // Computed: check if any filters are active (excluding view/sort)
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== "" ||
      statusFilter !== "all" ||
      priorityFilter !== null
    );
  }, [searchQuery, statusFilter, priorityFilter]);

  // Computed: build filter object for API queries
  const apiFilter = useMemo<ApiFilter>(
    () => ({
      view: activeFilter as ViewFilter,
      projectId: selectedProjectId,
      priority: priorityFilter,
      status:
        statusFilter === "all"
          ? null
          : (statusFilter as "active" | "completed"),
      searchQuery: searchQuery,
      sortBy: sortBy,
    }),
    [
      activeFilter,
      selectedProjectId,
      priorityFilter,
      statusFilter,
      searchQuery,
      sortBy,
    ],
  );

  // Clear all filters and reset to defaults
  const clearFilters = useCallback(() => {
    setCurrentPage(1);
    setActiveFilterState("all");
    setSearchQueryState("");
    setStatusFilterState("all");
    setPriorityFilterState(null);
  }, []);

  return {
    // Values
    activeFilter,
    selectedProjectId,
    searchQuery,
    priorityFilter,
    statusFilter,
    sortBy,
    currentPage,

    // Computed
    hasActiveFilters,
    apiFilter,

    // Setters with auto page reset
    setActiveFilter: withPageReset(setActiveFilterState),
    setSelectedProjectId: withPageReset(setSelectedProjectIdState),
    setSearchQuery: withPageReset(setSearchQueryState),
    setPriorityFilter: withPageReset(setPriorityFilterState),
    setStatusFilter: withPageReset(setStatusFilterState),
    setSortBy: withPageReset(setSortByState),

    // Page controls
    setCurrentPage,
    resetPage: () => setCurrentPage(1),
    clearFilters,
  };
}

const TaskFiltersContext = createContext<TaskFilters | null>(null);

export function TaskFiltersProvider({ children }: { children: ReactNode }) {
  const filters = useTaskFilters();
  return (
    <TaskFiltersContext.Provider value={filters}>
      {children}
    </TaskFiltersContext.Provider>
  );
}

export function useTaskFiltersContext(): TaskFilters {
  const ctx = useContext(TaskFiltersContext);
  if (!ctx) {
    throw new Error(
      "useTaskFiltersContext must be used inside TaskFiltersProvider",
    );
  }
  return ctx;
}
