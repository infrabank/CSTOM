import { StatCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 animate-pulse bg-surface-sunken rounded" />
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <Skeleton className="h-5 w-24 mb-4" />
          <Skeleton className="h-[280px] w-full" />
        </div>
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <Skeleton className="h-5 w-24 mb-4" />
          <Skeleton className="h-[280px] w-full" />
        </div>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
