import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getStatusDot } from "@/lib/utils";
import type { Property, DealAnalysis } from "@/lib/types/database";

interface DealCardProps {
  property: Property;
  analysis?: DealAnalysis;
}

export function DealCard({ property, analysis }: DealCardProps) {
  const score = analysis?.deal_score;

  return (
    <Link href={`/deals/${property.id}`}>
      <Card className="hover:border-[rgba(201,168,76,0.3)] transition-colors cursor-pointer">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="body-text truncate">{property.address}</p>
              <p className="caption-sm mt-0.5">
                {property.city}, {property.state}
              </p>
            </div>
            {score != null && (
              <span
                className={cn(
                  "shrink-0 deal-score",
                  score >= 80 ? "deal-score-high" : "deal-score-low"
                )}
              >
                {score}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between caption-sm">
            <span className="text-[var(--text-muted)]">{formatCurrency(property.list_price)}</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", getStatusDot(property.status))} />
              <span className="text-[var(--text-hint)] capitalize">
                {property.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>
          {analysis?.monthly_cash_flow != null && (
            <p className="caption-sm mt-2">
              CF: {formatCurrency(analysis.monthly_cash_flow)}/mo
              {analysis.cash_on_cash_return != null && (
                <> · CoC: {(analysis.cash_on_cash_return * 100).toFixed(1)}%</>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

const KANBAN_COLUMNS = [
  { key: "scanning", label: "Scanning" },
  { key: "underwriting", label: "Underwriting" },
  { key: "pending_approval", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

interface DealKanbanProps {
  properties: Property[];
  analyses?: Record<string, DealAnalysis>;
}

export function DealKanban({ properties, analyses = {} }: DealKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto">
      {KANBAN_COLUMNS.map(({ key, label }) => {
        const deals = properties.filter((p) =>
          key === "rejected" ? p.status === "rejected" || p.status === "dead" : p.status === key
        );
        return (
          <div key={key} className="min-w-[180px]">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="panel-heading">{label}</h3>
              <Badge variant="secondary">{deals.length}</Badge>
            </div>
            <div className="space-y-2">
              {deals.map((p) => (
                <DealCard key={p.id} property={p} analysis={analyses[p.id]} />
              ))}
              {deals.length === 0 && (
                <p className="empty-state py-6 border border-dashed border-[var(--border)] rounded-[2px]">
                  NO DEALS
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MiniDealPipeline({ properties }: { properties: Property[] }) {
  const pending = properties.filter((p) => p.status === "pending_approval").length;
  const active = properties.filter((p) =>
    ["scanning", "underwriting", "approved"].includes(p.status)
  ).length;
  const owned = properties.filter((p) => p.status === "active" || p.status === "owned").length;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="panel-heading mb-3">Deal Pipeline</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="kpi-value kpi-value-gold">{active}</p>
            <p className="kpi-hint mt-1">Active</p>
          </div>
          <div>
            <p className="kpi-value">{pending}</p>
            <p className="kpi-hint mt-1">Awaiting</p>
          </div>
          <div>
            <p className="kpi-value text-[var(--green)]">{owned}</p>
            <p className="kpi-hint mt-1">Owned</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
