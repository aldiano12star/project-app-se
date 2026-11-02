import { AppShell } from "@/components/layout/AppShell";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function EksplorasiLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-4 w-52 rounded-md" />
        </div>

        {/* Division Grid / Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} className="space-y-3 p-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-3.5 w-full rounded-md" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
