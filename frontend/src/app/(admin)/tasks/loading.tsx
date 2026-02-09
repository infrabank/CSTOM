import { TableSkeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 animate-pulse bg-surface-sunken rounded" />
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}
