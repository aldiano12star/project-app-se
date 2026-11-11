import { AppShell } from "@/components/layout/AppShell";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function OperatorUserManagementLoading() {
  return (
    <AppShell>
      <div className="space-y-5">
        {/* Top Back Navigation Skeleton */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>

        {/* Title Header Skeleton */}
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-6 w-56 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>

        {/* Filter Tabs Skeleton */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-container-low border border-edge overflow-x-hidden">
          <Skeleton className="h-10 w-36 rounded-xl shrink-0" />
          <Skeleton className="h-10 w-24 rounded-xl shrink-0" />
          <Skeleton className="h-10 w-24 rounded-xl shrink-0" />
          <Skeleton className="h-10 w-24 rounded-xl shrink-0" />
          <Skeleton className="h-10 w-20 rounded-xl shrink-0" />
        </div>

        {/* Search Bar Skeleton */}
        <Skeleton className="h-11 w-full rounded-xl" />

        {/* User Card Skeletons */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard
              key={i}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-36 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-48 rounded-md" />
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
