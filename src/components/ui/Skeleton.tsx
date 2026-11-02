import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-high/60 dark:bg-surface-container/60 ${className}`}
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
      className={`rounded-2xl border border-edge/60 bg-card p-5 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}
