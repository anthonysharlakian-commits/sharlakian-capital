import { notFound } from "next/navigation";
import { getProperty, getDealAnalysis } from "@/lib/data/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealApprovalActions } from "@/components/deals/deal-approval-actions";
import { ScoreRadarChart } from "@/components/dashboard/charts";
import {
  cn,
  formatCurrency,
  formatPercent,
  formatPercentRaw,
  getScoreColor,
  getScoreBadgeClass,
} from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Building2, MapPin } from "lucide-react";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [property, analysis] = await Promise.all([
    getProperty(id),
    getDealAnalysis(id),
  ]);

  if (!property) notFound();

  const score = analysis?.deal_score;
  const isPending = property.status === "pending_approval";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <MapPin className="h-4 w-4" />
            {property.city}, {property.state} {property.zip}
          </div>
          <h1 className="text-2xl font-bold">{property.address}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary" className="capitalize">{property.type}</Badge>
            <Badge variant="outline" className="capitalize">{property.status.replace(/_/g, " ")}</Badge>
            {analysis?.ai_recommendation && (
              <Badge variant="success" className="uppercase">{analysis.ai_recommendation.replace(/_/g, " ")}</Badge>
            )}
          </div>
        </div>
        {score != null && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deal Score</p>
            <p className={cn("text-5xl font-bold", getScoreColor(score))}>{score}</p>
            <span className={cn("inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold border", getScoreBadgeClass(score))}>
              {score >= 75 ? "Strong" : score >= 60 ? "Moderate" : "Weak"}
            </span>
          </div>
        )}
      </div>

      {/* Property photo placeholder */}
      <Card className="glass-card overflow-hidden">
        <div className="h-48 bg-secondary/50 flex items-center justify-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30" />
        </div>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-muted-foreground">List Price</p><p className="font-semibold">{formatCurrency(property.list_price)}</p></div>
          <div><p className="text-muted-foreground">Beds/Baths</p><p className="font-semibold">{property.bedrooms}/{property.bathrooms}</p></div>
          <div><p className="text-muted-foreground">Sqft</p><p className="font-semibold">{property.sqft?.toLocaleString()}</p></div>
          <div><p className="text-muted-foreground">Year Built</p><p className="font-semibold">{property.year_built}</p></div>
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Summary */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Financial Summary</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {[
                    ["Purchase Price", formatCurrency(analysis.purchase_price)],
                    ["Down Payment", `${formatCurrency(analysis.down_payment)} (${formatPercentRaw((analysis.down_payment_pct ?? 0) * 100, 0)})`],
                    ["Monthly Cash Flow", formatCurrency(analysis.monthly_cash_flow)],
                    ["Cap Rate", formatPercent(analysis.cap_rate)],
                    ["Cash-on-Cash", formatPercent(analysis.cash_on_cash_return)],
                    ["DSCR", analysis.dscr?.toFixed(2) ?? "—"],
                    ["Total Cash Needed", formatCurrency(analysis.total_cash_needed)],
                    ["Rehab Estimate", formatCurrency(analysis.rehab_estimate)],
                  ].map(([label, value]) => (
                    <TableRow key={label as string}>
                      <TableCell className="text-muted-foreground">{label}</TableCell>
                      <TableCell className="text-right font-medium">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          {analysis.score_breakdown && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Score Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ScoreRadarChart breakdown={analysis.score_breakdown} />
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader><CardTitle className="text-base">AI Analysis</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.ai_summary}</p>
            </CardContent>
          </Card>

          {/* Market Intel */}
          {analysis.market_data && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Market Intel</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {[
                      ["Days on Market", analysis.market_data.avg_days_on_market],
                      ["List/Sale Ratio", `${(analysis.market_data.list_to_sale_ratio * 100).toFixed(0)}%`],
                      ["Vacancy Rate", formatPercent(analysis.market_data.vacancy_rate)],
                      ["12mo Appreciation", formatPercent(analysis.market_data.price_appreciation_12mo)],
                      ["Neighborhood Score", `${analysis.market_data.neighborhood_score}/100`],
                    ].map(([label, value]) => (
                      <TableRow key={label as string}>
                        <TableCell className="text-muted-foreground">{label}</TableCell>
                        <TableCell className="text-right font-medium">{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Rehab Breakdown */}
          {analysis.rehab_breakdown && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Rehab Estimate</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary mb-3">
                  {formatCurrency(analysis.rehab_breakdown.total_estimate)}
                </p>
                <Badge variant="secondary" className="mb-4 capitalize">
                  Condition: {analysis.rehab_breakdown.condition_rating}
                </Badge>
                <Table>
                  <TableBody>
                    {Object.entries(analysis.rehab_breakdown.breakdown).map(([item, cost]) => (
                      <TableRow key={item}>
                        <TableCell className="text-muted-foreground capitalize">{item}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Comparable Sales */}
          {analysis.comparable_sales && (
            <Card className="glass-card lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Comparable Sales</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {analysis.comparable_sales.map((comp, i) => (
                    <div key={i} className="rounded-lg border border-border p-4">
                      <p className="font-medium text-sm">{comp.address}</p>
                      <p className="text-lg font-bold text-primary mt-1">{formatCurrency(comp.sold_price)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sold {comp.sold_date} · {comp.sqft} sqft · {comp.beds}bd/{comp.baths}ba
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Approval Actions */}
      {isPending && (
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Your Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <DealApprovalActions propertyId={property.id} />
          </CardContent>
        </Card>
      )}

      {property.status === "dead" && property.rejection_notes && (
        <Card className="glass-card border-score-low/30">
          <CardContent className="p-4">
            <p className="text-sm text-score-low font-medium">Rejection Notes</p>
            <p className="text-sm text-muted-foreground mt-1">{property.rejection_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
