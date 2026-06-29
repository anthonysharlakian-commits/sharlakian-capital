import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getScoreBadgeClass, getStatusDot } from "@/lib/utils";
import type { Property, DealAnalysis } from "@/lib/types/database";

interface DealCardProps {
  property: Property;
  analysis?: DealAnalysis;
}

export function DealCard({ property, analysis }: DealCardProps) {
  const score = analysis?.deal_score;

  return (
    <Link href={`/deals/${property.id}`}>
      <Card className="glass-card hover:border-primary/30 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{property.address}</p>
              <p className="text-xs text-muted-foreground">
                {property.city}, {property.state}
              </p>
            </div>
            {score != null && (
              <span
                className={cn(
                  "shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border",
                  getScoreBadgeClass(score)
                )}
              >
                {score}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{formatCurrency(property.list_price)}</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", getStatusDot(property.status))} />
              <span className="text-muted-foreground capitalize">
                {property.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>
          {analysis?.monthly_cash_flow != null && (
            <p className="text-xs mt-2 text-muted-foreground">
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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
      {KANBAN_COLUMNS.map(({ key, label }) => {
        const deals = properties.filter((p) =>
          key === "rejected" ? p.status === "rejected" || p.status === "dead" : p.status === key
        );
        return (
          <div key={key} className="min-w-[200px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {deals.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {deals.map((p) => (
                <DealCard key={p.id} property={p} analysis={analyses[p.id]} />
              ))}
              {deals.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                  No deals
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

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Deal Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-score-mid">{pending}</p>
            <p className="text-xs text-muted-foreground">Awaiting Review</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-score-high">
              {properties.filter((p) => p.status === "owned").length}
            </p>
            <p className="text-xs text-muted-foreground">Owned</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
