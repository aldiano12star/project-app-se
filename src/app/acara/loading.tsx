import { AppShell } from "@/components/layout/AppShell";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function AcaraLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Acara & Action Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Filter Pills Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Skeleton className="h-9 w-20 rounded-full shrink-0" />
          <Skeleton className="h-9 w-28 rounded-full shrink-0" />
          <Skeleton className="h-9 w-24 rounded-full shrink-0" />
          <Skeleton className="h-9 w-24 rounded-full shrink-0" />
        </div>

        {/* Acara Cards List */}
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-3/4 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              </div>
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <div className="flex items-center justify-between pt-2 border-t border-edge/40">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
