import Link from "next/link";
import type { DashboardDeal } from "@/lib/types/dashboard";
import { ConfidenceBadge, DataSourcesPanel } from "@/components/deals/deal-confidence";

function formatListPriceK(price: number | null): string {
  if (price == null) return "—";
  const k = price >= 1000 ? Math.round(price / 1000) : price;
  return `$${k}K`;
}

function formatCoc(coc: number | null): string {
  if (coc == null) return "—";
  return coc.toFixed(1);
}

function formatAduRent(value: number | null | undefined): string {
  if (value == null || value === 0) return "—";
  return `$${value.toLocaleString()}/mo`;
}

function formatCoverage(
  pct: number | null | undefined,
  ratio: number | null | undefined
): string {
  if (ratio != null && ratio > 0) return `${(ratio * 100).toFixed(0)}%`;
  if (pct == null || pct === 0) return "—";
  return `${pct.toFixed(0)}%`;
}

function formatCashFlow(value: number | null | undefined): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toLocaleString()}/mo`;
}

interface DealsPipelineProps {
  deals: DashboardDeal[];
}

export function DealsPipeline({ deals }: DealsPipelineProps) {
  if (!deals.length) {
    return (
      <div className="panel p-5">
        <p className="panel-heading mb-2">Deal Pipeline</p>
        <p className="empty-state py-8">
          NO DEALS IN PIPELINE — RUN THE SCANNER OR ADD A DEAL
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <p className="panel-heading mb-4">Deal Pipeline</p>
      <div className="space-y-3">
        {deals.map((deal, index) => {
          const score = deal.ai_score ?? 0;
          const scoreHigh = score >= 80;
          const dealKey = deal.id ?? `deal-${index}`;
          const externalLink = deal.listing_url;

          return (
            <div
              key={dealKey}
              className="flex items-center justify-between gap-3 py-2 border-b border-[rgba(201,168,76,0.08)] last:border-0"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`deal-score shrink-0 ${
                    scoreHigh ? "deal-score-high" : "deal-score-low"
                  }`}
                >
                  {deal.ai_score != null ? score : "—"}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="deal-address truncate">{deal.address ?? "—"}</p>
                    <ConfidenceBadge level={deal.confidence_level} />
                  </div>
                  <p className="deal-meta mt-0.5">
                    {deal.city ? `${deal.city} · ` : ""}
                    {formatListPriceK(deal.list_price)} · CoC {formatCoc(deal.coc_return)}%
                    · ADU {formatAduRent(deal.adu_rent_estimate)} · Coverage{" "}
                    {formatCoverage(deal.adu_coverage_pct, deal.rent_coverage_ratio)}
                    {deal.market ? ` · ${deal.market}` : ""}
                    {deal.monthly_cash_flow != null
                      ? ` · CF ${formatCashFlow(deal.monthly_cash_flow)}`
                      : ""}
                  </p>
                  <DataSourcesPanel sources={deal.data_sources as Record<string, unknown>} />
                </div>
              </div>
              {deal.id && !deal.property_id ? (
                <Link
                  href={`/deals/${deal.id}`}
                  className={index === 0 ? "btn-gold shrink-0" : "btn-muted shrink-0"}
                >
                  {index === 0 ? "Review" : "View"}
                </Link>
              ) : externalLink ? (
                <a
                  href={externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={index === 0 ? "btn-gold shrink-0" : "btn-muted shrink-0"}
                >
                  {index === 0 ? "Review" : "View"}
                </a>
              ) : deal.property_id ? (
                <Link
                  href={`/deals/${deal.property_id}`}
                  className={index === 0 ? "btn-gold shrink-0" : "btn-muted shrink-0"}
                >
                  {index === 0 ? "Review" : "View"}
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
