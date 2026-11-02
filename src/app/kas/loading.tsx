import { AppShell } from "@/components/layout/AppShell";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function KasLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header & Role */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-4 w-44 rounded-md" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        {/* Balance Overview Card */}
        <SkeletonCard className="space-y-4">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-10 w-56 rounded-xl" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </SkeletonCard>

        {/* Transactions / Kas List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="flex items-center justify-between py-3.5 px-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-md" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
