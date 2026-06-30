"use client";

import type { DealDataSources } from "@/lib/deal-scanner/confidence";

export type ConfidenceLevel = "High" | "Medium" | "Low";

const STYLES: Record<ConfidenceLevel, string> = {
  High: "border-[var(--gold)] text-[var(--gold)] bg-[rgba(201,168,76,0.12)]",
  Medium: "border-[rgba(201,168,76,0.35)] text-[var(--text-secondary)] bg-[rgba(201,168,76,0.06)]",
  Low: "border-[var(--red)] text-[var(--red)] bg-[rgba(224,82,82,0.1)]",
};

export function ConfidenceBadge({
  level,
  className = "",
}: {
  level: ConfidenceLevel | string | null | undefined;
  className?: string;
}) {
  const normalized = (level ?? "Low") as ConfidenceLevel;
  const safe = STYLES[normalized] ? normalized : "Low";

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide ${STYLES[safe]} ${className}`}
    >
      {safe} confidence
    </span>
  );
}

export function DataSourcesPanel({
  sources,
}: {
  sources: DealDataSources | Record<string, unknown> | null | undefined;
}) {
  if (!sources || typeof sources !== "object") return null;

  const entries = Object.entries(sources as Record<string, { source?: string; date?: string; note?: string }>);
  if (!entries.length) return null;

  return (
    <details className="mt-2 group">
      <summary className="cursor-pointer text-[0.75rem] text-[var(--text-muted)] hover:text-[var(--gold)] list-none flex items-center gap-1">
        <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
        Data Sources
      </summary>
      <div className="mt-2 space-y-2 pl-3 border-l border-[rgba(201,168,76,0.14)]">
        {entries.map(([key, val]) => (
          <div key={key}>
            <p className="text-[0.7rem] uppercase tracking-wide text-[var(--text-hint)]">
              {key.replace(/_/g, " ")}
            </p>
            <p className="text-[0.8rem] text-[var(--text-secondary)]">{val?.source ?? "—"}</p>
            {val?.date && (
              <p className="text-[0.7rem] text-[var(--text-muted)]">Pulled {val.date}</p>
            )}
            {val?.note && (
              <p className="text-[0.7rem] text-[var(--text-muted)] italic">{val.note}</p>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
