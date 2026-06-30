import Link from "next/link";
import type { DashboardDeal } from "@/lib/types/dashboard";
import type { UnderwritingReport } from "@/lib/underwriter";
import { ConfidenceBadge, DataSourcesPanel } from "@/components/deals/deal-confidence";
import { UnderwritingPanel } from "@/components/deals/underwriting-panel";
import { formatCurrency, cn } from "@/lib/utils";
import { MapPin, ExternalLink } from "lucide-react";

function formatPct(value: number | null | undefined, ratio?: number | null): string {
  if (ratio != null && ratio > 0) return `${(ratio * 100).toFixed(0)}%`;
  if (value == null) return "—";
  return `${value.toFixed(0)}%`;
}

export function ScannerDealDetail({
  deal,
  underwritingReport,
}: {
  deal: DashboardDeal;
  underwritingReport?: UnderwritingReport | null;
}) {
  const score = deal.ai_score ?? 0;
  const scoreHigh = score >= 80;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 caption-sm text-[var(--text-muted)] mb-1">
            <MapPin className="h-3 w-3" />
            {deal.city ?? "—"}
            {deal.market ? ` · ${deal.market}` : ""}
          </div>
          <h1 className="page-title">{deal.address}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <ConfidenceBadge level={deal.confidence_level} />
            {deal.status && (
              <span className="text-[0.75rem] uppercase tracking-wide text-[var(--text-muted)] border border-[var(--border)] px-2 py-0.5 rounded">
                {deal.status}
              </span>
            )}
          </div>
        </div>
        <div className="text-center panel px-5 py-3">
          <p className="kpi-label">Deal Score</p>
          <p
            className={cn(
              "mt-1 score-hero",
              scoreHigh ? "deal-score-high" : "deal-score-low"
            )}
          >
            {deal.ai_score ?? "—"}
          </p>
        </div>
      </div>

      <div className="panel p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ["List Price", formatCurrency(deal.list_price)],
          ["CoC Return", deal.coc_return != null ? `${deal.coc_return.toFixed(1)}%` : "—"],
          ["ADU Rent Est.", formatCurrency(deal.adu_rent_estimate)],
          ["Coverage", formatPct(deal.adu_coverage_pct, deal.rent_coverage_ratio)],
          ["Monthly PITI", formatCurrency(deal.mortgage_estimate)],
          ["Cash Flow", formatCurrency(deal.monthly_cash_flow)],
          ["Cash Needed", formatCurrency(deal.total_cash_needed ?? null)],
          ["FHA", deal.fha_eligible ? "Eligible" : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="kpi-label">{label}</p>
            <p className="kpi-value mt-1 text-[18px]">{value}</p>
          </div>
        ))}
      </div>

      <div className="panel p-5">
        <p className="panel-heading mb-3">Data Sources</p>
        <DataSourcesPanel sources={deal.data_sources as Record<string, unknown>} />
        {deal.notes && (
          <p className="text-[0.8rem] text-[var(--text-muted)] mt-4 border-t border-[var(--border)] pt-3">
            {deal.notes}
          </p>
        )}
      </div>

      {underwritingReport && (
        <UnderwritingPanel report={underwritingReport as UnderwritingReport} />
      )}

      {deal.listing_url && (
        <a
          href={deal.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold inline-flex items-center gap-2"
        >
          View Listing
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <Link href="/deals" className="btn-muted inline-block">
        Back to Pipeline
      </Link>
    </div>
  );
}
