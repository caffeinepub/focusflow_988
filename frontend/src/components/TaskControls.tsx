import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import FilterModal, { type StatusFilter } from "./FilterModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Priority } from "../hooks/useQueries";
import { useDebouncedCallback } from "../hooks/useDebounce";
import { useTaskFiltersContext } from "../hooks/useTaskFilters";

type SortOption =
  | "dueDate-asc"
  | "dueDate-desc"
  | "priority-desc"
  | "priority-asc"
  | "created-desc"
  | "created-asc"
  | "alpha-asc"
  | "alpha-desc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "dueDate-asc", label: "Due Date (Earliest)" },
  { value: "dueDate-desc", label: "Due Date (Latest)" },
  { value: "priority-desc", label: "Priority (High First)" },
  { value: "priority-asc", label: "Priority (Low First)" },
  { value: "created-desc", label: "Newest First" },
  { value: "created-asc", label: "Oldest First" },
  { value: "alpha-asc", label: "A-Z" },
  { value: "alpha-desc", label: "Z-A" },
];

/**
 * Task search, filter, and sort controls.
 * Uses shared filter context - no props needed.
 */
export default function TaskControls() {
  const filters = useTaskFiltersContext();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const debouncedSearchChange = useDebouncedCallback(
    filters.setSearchQuery,
    300,
  );

  useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  const hasActiveFilters = filters.priorityFilter !== null;

  const handleApplyFilters = (
    priority: Priority | null,
    status: StatusFilter,
  ) => {
    filters.setPriorityFilter(priority);
    filters.setStatusFilter(status);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[140px] sm:min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              debouncedSearchChange(e.target.value);
            }}
            className="pl-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setFilterModalOpen(true)}
          className={`relative ${hasActiveFilters ? "border-primary" : ""}`}
        >
          <SlidersHorizontal
            className={hasActiveFilters ? "text-primary" : ""}
          />
          <span
            className={`hidden sm:inline ${hasActiveFilters ? "text-primary" : ""}`}
          >
            Filter
          </span>
          {hasActiveFilters && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {(filters.priorityFilter !== null ? 1 : 0) +
                (filters.statusFilter !== "all" ? 1 : 0)}
            </span>
          )}
        </Button>

        <Select value={filters.sortBy} onValueChange={filters.setSortBy}>
          <SelectTrigger className="w-auto [&>svg:last-child]:hidden [&>svg:last-child]:sm:block">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        priorityFilter={filters.priorityFilter}
        statusFilter={filters.statusFilter}
        onApply={handleApplyFilters}
      />
    </>
  );
}

export type { Priority, StatusFilter, SortOption };
