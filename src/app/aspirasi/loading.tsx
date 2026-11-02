import { AppShell } from "@/components/layout/AppShell";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function AspirasiLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        {/* Polling / Feedback Cards */}
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="space-y-3">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-6 w-5/6 rounded-lg" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
