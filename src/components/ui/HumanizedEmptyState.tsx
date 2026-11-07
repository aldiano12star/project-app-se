import React from "react";
import type { LucideIcon } from "lucide-react";

interface HumanizedEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  className?: string;
}

export function HumanizedEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: HumanizedEmptyStateProps) {
  return (
    <div
      className={`card-solid bg-card p-8 sm:p-10 text-center rounded-2xl border border-edge/80 flex flex-col items-center justify-center space-y-3.5 transition-all ${className}`}
    >
      {/* Decorative Icon Wrapper with Ambient Soft Circle */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl scale-150 pointer-events-none" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-low border border-edge shadow-xs">
          <Icon className="h-8 w-8 text-ink-muted/40 stroke-[1.5]" />
        </div>
      </div>

      {/* Copywriting */}
      <div className="space-y-1.5 max-w-sm mx-auto">
        <h4 className="text-sm sm:text-base font-bold text-ink tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-ink-muted leading-relaxed">
          {description}
        </p>
      </div>

      {/* Optional Interactive CTA */}
      {action && (
        <div className="pt-2">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex h-11 min-h-11 items-center justify-center gap-2 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              <span>{action.label}</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex h-11 min-h-11 items-center justify-center gap-2 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              <span>{action.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
