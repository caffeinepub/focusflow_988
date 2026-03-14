import { Download, Loader2, Plus } from "lucide-react";
import { useTaskFiltersContext } from "../hooks/useTaskFilters";
import { Button } from "@/components/ui/button";

export type TimeFilter = "today" | "upcoming" | "all";

type TaskToolbarProps = {
  onExport: () => void;
  isExporting?: boolean;
  exportDisabled?: boolean;
  onAddTask: () => void;
};

const tabs: { id: TimeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
];

export default function TaskToolbar({
  onExport,
  isExporting,
  exportDisabled,
  onAddTask,
}: TaskToolbarProps) {
  const filters = useTaskFiltersContext();

  return (
    <div className="flex items-center justify-between">
      <nav className="flex">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => filters.setActiveFilter(tab.id)}
            className={`rounded-none border-b-2 hover:bg-transparent ${
              filters.activeFilter === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Button
          onClick={onExport}
          disabled={isExporting || exportDisabled}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isExporting ? "Exporting..." : "Export CSV"}
          </span>
        </Button>
        <Button onClick={onAddTask}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </Button>
      </div>
    </div>
  );
}
