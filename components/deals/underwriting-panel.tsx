"use client";



import { useState } from "react";

import { formatCurrency, formatPercent } from "@/lib/utils";

import type { UnderwritingReport } from "@/lib/underwriter";

import { ChevronDown, ChevronUp } from "lucide-react";



function recommendationStyles(rec: string): { bg: string; color: string; border: string } {

  switch (rec) {

    case "GO":

      return {

        bg: "rgba(0,201,122,0.12)",

        color: "#00C97A",

        border: "rgba(0,201,122,0.35)",

      };

    case "CAUTION":

      return {

        bg: "rgba(201,168,76,0.12)",

        color: "#C9A84C",

        border: "rgba(201,168,76,0.35)",

      };

    case "NO-GO":

      return {

        bg: "rgba(224,82,82,0.12)",

        color: "#E05252",

        border: "rgba(224,82,82,0.35)",

      };

    default:

      return {

        bg: "rgba(90,112,144,0.12)",

        color: "#8A9FB8",

        border: "var(--border)",

      };

  }

}



export function UnderwritingPanel({ report }: { report: UnderwritingReport }) {

  const [expanded, setExpanded] = useState(false);

  const styles = recommendationStyles(report.recommendation);

  const stress = report.stress_test_results;

  const phase1 = report.phase1;

  const phase2 = report.phase2 as {

    capRate?: number;

    cashOnCashReturn?: number;

    monthlyCashFlow?: number;

  } | null;

  const scoreBreakdown = report.score_breakdown;



  const ownerMarketRent =

    phase1?.ownerUnitMarketRent ??

    (phase1

      ? phase1.effectiveHousingCost + phase1.monthlySavingsVsRenting

      : 0);



  return (

    <div className="panel p-5 space-y-4">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div>

          <p className="panel-heading">Underwriter Analysis</p>

          <p className="caption-sm text-[var(--text-muted)] mt-1">

            {new Date(report.created_at).toLocaleString()}

            {report.deal_score != null && (

              <span className="ml-2">· Score {report.deal_score}/100</span>

            )}

          </p>

        </div>

        <span

          className="inline-flex items-center px-3 py-1 rounded text-[0.75rem] font-medium uppercase tracking-wide"

          style={{

            backgroundColor: styles.bg,

            color: styles.color,

            border: `1px solid ${styles.border}`,

          }}

        >

          {report.recommendation}

        </span>

      </div>



      {phase1 && (

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <div className="panel p-4 bg-[rgba(201,168,76,0.04)]">

            <p className="kpi-label mb-2">Phase 1 — House-Hack (live in owner unit)</p>

            <p className="text-[0.9rem] text-[var(--text-secondary)] leading-relaxed">

              Effective housing cost:{" "}

              <span className="text-[var(--text-primary)]">

                {formatCurrency(phase1.effectiveHousingCost)}/mo

              </span>{" "}

              vs{" "}

              <span className="text-[var(--text-primary)]">

                {formatCurrency(ownerMarketRent)}

              </span>{" "}

              market rent →{" "}

              <span

                style={{

                  color:

                    phase1.monthlySavingsVsRenting >= 0

                      ? "var(--green)"

                      : "var(--red)",

                }}

              >

                {formatCurrency(Math.abs(phase1.monthlySavingsVsRenting))}/mo{" "}

                {phase1.monthlySavingsVsRenting >= 0 ? "saved" : "above market"}

              </span>

            </p>

            <p className="kpi-hint mt-2">

              ADU covers {(phase1.aduRentCoverage * 100).toFixed(0)}% of PITI (

              {formatCurrency(phase1.totalPiti)}/mo)

            </p>

          </div>



          {phase2 && (

            <div className="panel p-4 bg-[rgba(201,168,76,0.04)]">

              <p className="kpi-label mb-2">Phase 2 — Fully Rented</p>

              <p className="text-[0.9rem] text-[var(--text-secondary)] leading-relaxed">

                Once fully rented: cap rate{" "}

                <span className="text-[var(--text-primary)]">

                  {formatPercent(phase2.capRate ?? 0)}

                </span>

                , CoC{" "}

                <span className="text-[var(--text-primary)]">

                  {formatPercent(phase2.cashOnCashReturn ?? 0)}

                </span>

              </p>

              {phase2.monthlyCashFlow != null && (

                <p className="kpi-hint mt-2">

                  Projected cash flow: {formatCurrency(phase2.monthlyCashFlow)}/mo

                </p>

              )}

            </div>

          )}

        </div>

      )}



      {scoreBreakdown && (

        <div className="flex flex-wrap gap-3 text-[0.8rem]">

          {[

            ["Phase 1 (ADU coverage)", scoreBreakdown.phase1Score, 40],

            ["Phase 2 cap rate", scoreBreakdown.phase2CapRateScore, 30],

            ["Phase 2 CoC", scoreBreakdown.phase2CocScore, 30],

          ].map(([label, score, max]) => (

            <span

              key={label as string}

              className="px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)]"

            >

              {label}: {score}/{max}

            </span>

          ))}

        </div>

      )}



      <p className="body-text leading-relaxed">{report.reasoning}</p>



      {report.risk_flags.length > 0 && (

        <div>

          <p className="kpi-label mb-2">Risk Flags</p>

          <ul className="space-y-1.5">

            {report.risk_flags.map((flag, i) => (

              <li

                key={i}

                className="text-[0.85rem] text-[var(--text-secondary)] flex gap-2"

              >

                <span className="text-[var(--gold)] shrink-0">•</span>

                {flag}

              </li>

            ))}

          </ul>

        </div>

      )}



      {stress && (

        <>

          <button

            type="button"

            onClick={() => setExpanded(!expanded)}

            className="flex items-center gap-2 text-[0.8rem] text-[var(--gold)] hover:opacity-80 transition-opacity"

          >

            {expanded ? (

              <ChevronUp className="h-4 w-4" />

            ) : (

              <ChevronDown className="h-4 w-4" />

            )}

            {expanded ? "Hide stress tests" : "Show stress test scenarios"}

          </button>



          {expanded && (

            <div className="space-y-4 border-t border-[var(--border)] pt-4">

              <div>

                <p className="kpi-label mb-2">

                  Rent Stress (5% vacancy + 1% maintenance reserve)

                </p>

                <div className="overflow-x-auto">

                  <table className="w-full text-[0.8rem]">

                    <thead>

                      <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">

                        <th className="text-left py-2 pr-3 font-normal">Scenario</th>

                        <th className="text-right py-2 px-2 font-normal">Rent</th>

                        <th className="text-right py-2 px-2 font-normal">PITI</th>

                        <th className="text-right py-2 pl-2 font-normal">Net Cash Flow</th>

                      </tr>

                    </thead>

                    <tbody>

                      {stress.rent_scenarios.map((s) => (

                        <tr

                          key={s.label}

                          className="border-b border-[var(--border)] last:border-0"

                        >

                          <td className="py-2 pr-3 text-[var(--text-secondary)]">

                            {s.label}

                          </td>

                          <td className="py-2 px-2 text-right">

                            {formatCurrency(s.monthly_rent)}

                          </td>

                          <td className="py-2 px-2 text-right">

                            {formatCurrency(s.monthly_piti)}

                          </td>

                          <td

                            className="py-2 pl-2 text-right"

                            style={{

                              color:

                                s.monthly_cash_flow >= 0

                                  ? "var(--green)"

                                  : "var(--red)",

                            }}

                          >

                            {formatCurrency(s.monthly_cash_flow)}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>



              <div>

                <p className="kpi-label mb-2">Rate Stress</p>

                <div className="overflow-x-auto">

                  <table className="w-full text-[0.8rem]">

                    <thead>

                      <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">

                        <th className="text-left py-2 pr-3 font-normal">Scenario</th>

                        <th className="text-right py-2 px-2 font-normal">PITI</th>

                        <th className="text-right py-2 pl-2 font-normal">Net Cash Flow</th>

                      </tr>

                    </thead>

                    <tbody>

                      {stress.rate_scenarios.map((s) => (

                        <tr

                          key={s.label}

                          className="border-b border-[var(--border)] last:border-0"

                        >

                          <td className="py-2 pr-3 text-[var(--text-secondary)]">

                            {s.label}

                          </td>

                          <td className="py-2 px-2 text-right">

                            {formatCurrency(s.monthly_piti)}

                          </td>

                          <td

                            className="py-2 pl-2 text-right"

                            style={{

                              color:

                                s.monthly_cash_flow >= 0

                                  ? "var(--green)"

                                  : "var(--red)",

                            }}

                          >

                            {formatCurrency(s.monthly_cash_flow)}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>



              <div className="panel p-3 bg-[rgba(201,168,76,0.04)]">

                <p className="kpi-label mb-1">Combined Stress</p>

                <p className="text-[0.85rem] text-[var(--text-secondary)]">

                  {stress.combined_stress.label}:{" "}

                  <span

                    style={{

                      color:

                        stress.combined_stress.monthly_cash_flow >= 0

                          ? "var(--green)"

                          : "var(--red)",

                    }}

                  >

                    {formatCurrency(stress.combined_stress.monthly_cash_flow)}/mo

                  </span>

                </p>

              </div>

            </div>

          )}

        </>

      )}

    </div>

  );

}

