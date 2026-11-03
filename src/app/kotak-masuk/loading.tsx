import { AppShell } from "@/components/layout/AppShell";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function KotakMasukLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 pt-1">
          <Skeleton className="h-7 w-36 rounded-lg" />
          <Skeleton className="h-4 w-60 rounded-md" />
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
        </div>

        {/* Notification items */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="p-4 space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3 items-start flex-1">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-5 w-48 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
