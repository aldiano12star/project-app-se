import { AppShell } from "@/components/layout/AppShell";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function PengaturanLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Profile Card Skeleton */}
        <SkeletonCard className="flex items-center gap-4 p-5">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-44 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
        </SkeletonCard>

        {/* Settings Sections Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-32 rounded-md" />
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="flex items-center justify-between py-3.5 px-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <Skeleton className="h-5 w-36 rounded-md" />
              </div>
              <Skeleton className="h-5 w-5 rounded-md" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
