"use client";

import React, { ReactNode } from "react";
import { 
  Inbox, 
  SearchX, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Empty State
export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("glass-card rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 border border-slate-200 dark:border-white/10", className)}>
      <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-500/20 shadow-sm">
        <Icon size={26} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="font-semibold text-base sm:text-lg text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-primary-500/20 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// 2. No Search Results State
export interface NoSearchResultsProps {
  query?: string;
  onClear?: () => void;
  className?: string;
}

export function NoSearchResults({
  query,
  onClear,
  className,
}: NoSearchResultsProps) {
  return (
    <div className={cn("glass-card rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-3 border border-slate-200 dark:border-white/10", className)}>
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground flex items-center justify-center border border-slate-200 dark:border-white/10">
        <SearchX size={22} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="font-semibold text-base text-foreground">No matches found</h3>
        <p className="text-xs text-muted-foreground">
          {query ? (
            <>No results found for &ldquo;<span className="text-foreground font-medium">{query}</span>&rdquo;. Check your spelling or try broader keywords.</>
          ) : (
            "We couldn't find anything matching your filters or search criteria."
          )}
        </p>
      </div>
      {onClear && (
        <button
          onClick={onClear}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold text-foreground border border-slate-200 dark:border-white/10 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

// 3. Error State
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while processing this request. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("glass-card rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-3.5 border border-rose-500/20 bg-rose-500/[0.02]", className)}>
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
        <AlertTriangle size={22} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="font-semibold text-base text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-xs font-semibold text-foreground border border-slate-200 dark:border-white/10 transition-colors active:scale-95"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}

// 4. Loading State & Skeleton Shimmer
export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Loading your wellness data...",
  className,
}: LoadingStateProps) {
  return (
    <div className={cn("py-12 flex flex-col items-center justify-center space-y-3 text-center", className)}>
      <div className="relative flex items-center justify-center">
        <Loader2 size={32} className="text-primary-500 animate-spin" />
      </div>
      <p className="text-xs font-medium text-muted-foreground animate-pulse">{label}</p>
    </div>
  );
}

// 5. Permission Denied State
export interface PermissionDeniedStateProps {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function PermissionDeniedState({
  title = "Permission Required",
  description = "You do not have administrative or authorization privileges to access this area.",
  onAction,
  actionLabel = "Return to Dashboard",
  className,
}: PermissionDeniedStateProps) {
  return (
    <div className={cn("glass-card rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 border border-amber-500/30 bg-amber-500/[0.02]", className)}>
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
        <ShieldAlert size={28} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="font-semibold text-base sm:text-lg text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// 6. Success State Card
export interface SuccessStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function SuccessState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: SuccessStateProps) {
  return (
    <div className={cn("glass-card rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 border border-emerald-500/30 bg-emerald-500/[0.02]", className)}>
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
        <CheckCircle2 size={28} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="font-semibold text-base sm:text-lg text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// 7. Form Field Error Component
export function FormFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-1.5 flex items-center gap-1 animate-in fade-in duration-150">
      <AlertTriangle size={12} className="shrink-0" />
      <span>{message}</span>
    </p>
  );
}
