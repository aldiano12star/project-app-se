import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-high/60 dark:bg-white/5 ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-edge/80 dark:border-white/10 bg-card p-5 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}
