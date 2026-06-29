import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentRaw(value: number | null | undefined, decimals = 1): string {
  if (value == null) return "—";
  return `${value.toFixed(decimals)}%`;
}

export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 75) return "text-score-high";
  if (score >= 60) return "text-score-mid";
  return "text-score-low";
}

export function getScoreBadgeClass(score: number | null | undefined): string {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 75) return "bg-score-high/20 text-score-high border-score-high/30";
  if (score >= 60) return "bg-score-mid/20 text-score-mid border-score-mid/30";
  return "bg-score-low/20 text-score-low border-score-low/30";
}

export function getStatusDot(status: string): string {
  const map: Record<string, string> = {
    owned: "bg-score-high",
    approved: "bg-score-high",
    active: "bg-score-high",
    completed: "bg-score-high",
    pending_approval: "bg-score-mid",
    underwriting: "bg-score-mid",
    scanning: "bg-score-mid",
    open: "bg-score-mid",
    in_progress: "bg-score-mid",
    rejected: "bg-score-low",
    dead: "bg-score-low",
    late: "bg-score-low",
    emergency: "bg-score-low",
    eviction: "bg-score-low",
  };
  return map[status] ?? "bg-muted-foreground";
}
