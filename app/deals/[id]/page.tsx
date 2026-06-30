import { notFound } from "next/navigation";
import { getProperty, getDealAnalysis, getDealById, getUnderwritingReport } from "@/lib/data/queries";
import { ScannerDealDetail } from "@/components/deals/scanner-deal-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealApprovalActions } from "@/components/deals/deal-approval-actions";
import { ScoreRadarChart } from "@/components/dashboard/charts";
import {
  formatCurrency,
  formatPercent,
  formatPercentRaw,
  cn,
} from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Building2, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [property, analysis, pipelineDeal, underwritingReport] = await Promise.all([
    getProperty(id),
    getDealAnalysis(id),
    getDealById(id),
    getUnderwritingReport(id),
  ]);

  if (!property && pipelineDeal && !pipelineDeal.property_id) {
    return (
      <ScannerDealDetail
        deal={pipelineDeal}
        underwritingReport={underwritingReport}
      />
    );
  }

  if (!property) notFound();

  const score = analysis?.deal_score;
  const isPending = property.status === "pending_approval";
  const scoreHigh = score != null && score >= 80;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 caption-sm text-[var(--text-muted)] mb-1">
            <MapPin className="h-3 w-3" />
            {property.city}, {property.state} {property.zip}
          </div>
          <h1 className="page-title">{property.address}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="capitalize">{property.type}</Badge>
            <Badge variant="outline" className="capitalize">{property.status.replace(/_/g, " ")}</Badge>
            {analysis?.ai_recommendation && (
              <Badge variant="success" className="uppercase">
                {analysis.ai_recommendation.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
        </div>
        {score != null && (
          <div className="text-center panel px-5 py-3">
            <p className="kpi-label">Deal Score</p>
            <p
              className={cn(
                "mt-1 score-hero",
                scoreHigh ? "deal-score-high" : "deal-score-low"
              )}
            >
              {score}
            </p>
            <p className="kpi-hint mt-1">
              {score >= 75 ? "Strong" : score >= 60 ? "Moderate" : "Weak"}
            </p>
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="h-40 bg-[rgba(201,168,76,0.04)] flex items-center justify-center border-b border-[var(--border)]">
          <Building2 className="h-12 w-12 text-[var(--text-hint)]" />
        </div>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ["List Price", formatCurrency(property.list_price)],
            ["Beds/Baths", `${property.bedrooms ?? "—"}/${property.bathrooms ?? "—"}`],
            ["Sqft", property.sqft?.toLocaleString() ?? "—"],
            ["Year Built", property.year_built ?? "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="kpi-label">{label}</p>
              <p className="kpi-value mt-1 text-[18px]">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {analysis.phase1 && (
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>House-Hack Underwriting</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="panel p-4">
                  <p className="kpi-label mb-2">Phase 1 — Live in Owner Unit</p>
                  <p className="text-[0.9rem] text-[var(--text-secondary)] leading-relaxed">
                    Effective housing cost:{" "}
                    <span className="text-[var(--text-primary)]">
                      {formatCurrency(analysis.phase1.effectiveHousingCost)}/mo
                    </span>{" "}
                    vs{" "}
                    <span className="text-[var(--text-primary)]">
                      {formatCurrency(
                        analysis.phase1.ownerUnitMarketRent ??
                          analysis.phase1.effectiveHousingCost +
                            analysis.phase1.monthlySavingsVsRenting
                      )}
                    </span>{" "}
                    market rent →{" "}
                    <span
                      style={{
                        color:
                          analysis.phase1.monthlySavingsVsRenting >= 0
                            ? "var(--green)"
                            : "var(--red)",
                      }}
                    >
                      {formatCurrency(
                        Math.abs(analysis.phase1.monthlySavingsVsRenting)
                      )}
                      /mo{" "}
                      {analysis.phase1.monthlySavingsVsRenting >= 0
                        ? "saved"
                        : "above market"}
                    </span>
                  </p>
                </div>
                {analysis.phase2 && (
                  <div className="panel p-4">
                    <p className="kpi-label mb-2">Phase 2 — Fully Rented</p>
                    <p className="text-[0.9rem] text-[var(--text-secondary)] leading-relaxed">
                      Once fully rented: cap rate{" "}
                      <span className="text-[var(--text-primary)]">
                        {formatPercent(
                          (analysis.phase2 as { capRate?: number }).capRate ??
                            analysis.cap_rate ??
                            0
                        )}
                      </span>
                      , CoC{" "}
                      <span className="text-[var(--text-primary)]">
                        {formatPercent(
                          (analysis.phase2 as { cashOnCashReturn?: number })
                            .cashOnCashReturn ??
                            analysis.cash_on_cash_return ??
                            0
                        )}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Financial Summary</CardTitle></CardHeader>
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
                      <TableCell className="text-[var(--text-hint)]">{label}</TableCell>
                      <TableCell className="text-right text-[var(--text-secondary)]">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {analysis.score_breakdown && (
            <Card>
              <CardHeader><CardTitle>Score Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ScoreRadarChart breakdown={analysis.score_breakdown} />
              </CardContent>
            </Card>
          )}

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>AI Analysis</CardTitle></CardHeader>
            <CardContent>
              <p className="body-text leading-relaxed">{analysis.ai_summary}</p>
            </CardContent>
          </Card>

          {analysis.market_data && (
            <Card>
              <CardHeader><CardTitle>Market Intel</CardTitle></CardHeader>
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
                        <TableCell className="text-[var(--text-hint)]">{label}</TableCell>
                        <TableCell className="text-right text-[var(--text-secondary)]">{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {analysis.rehab_breakdown && (
            <Card>
              <CardHeader><CardTitle>Rehab Estimate</CardTitle></CardHeader>
              <CardContent>
                <p className="kpi-value kpi-value-gold mb-3">
                  {formatCurrency(analysis.rehab_breakdown.total_estimate)}
                </p>
                <Badge variant="secondary" className="mb-4 capitalize">
                  Condition: {analysis.rehab_breakdown.condition_rating}
                </Badge>
                <Table>
                  <TableBody>
                    {Object.entries(analysis.rehab_breakdown.breakdown).map(([item, cost]) => (
                      <TableRow key={item}>
                        <TableCell className="text-[var(--text-hint)] capitalize">{item}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {analysis.comparable_sales && (
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Comparable Sales</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {analysis.comparable_sales.map((comp, i) => (
                    <div key={i} className="panel p-4">
                      <p className="body-text">{comp.address}</p>
                      <p className="kpi-value kpi-value-gold mt-1 text-[18px]">
                        {formatCurrency(comp.sold_price)}
                      </p>
                      <p className="kpi-hint mt-2">
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

      {isPending && (
        <Card className="border-[rgba(201,168,76,0.3)]">
          <CardHeader>
            <CardTitle>Your Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <DealApprovalActions propertyId={property.id} />
          </CardContent>
        </Card>
      )}

      {property.status === "dead" && property.rejection_notes && (
        <Card className="border-[rgba(224,82,82,0.3)]">
          <CardContent className="p-4">
            <p className="form-label text-[var(--red)]">Rejection Notes</p>
            <p className="body-text mt-2">{property.rejection_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
