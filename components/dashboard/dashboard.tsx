import Link from "next/link";
import { CashFlowBarChart } from "@/components/dashboard/cash-flow-chart";
import type {
  DashboardAgent,
  DashboardDeal,
  DashboardKpis,
  DashboardMaintenance,
  CashflowEntry,
} from "@/lib/types/dashboard";

interface DashboardProps {
  properties: unknown[];
  deals: DashboardDeal[];
  cashflow: CashflowEntry[];
  agents: DashboardAgent[];
  maintenance: DashboardMaintenance[];
  kpis: DashboardKpis;
}

function formatCurrency(value: number, hasData: boolean): string {
  if (!hasData || value === 0) return "—";
  return `$${value.toLocaleString()}`;
}

function formatCashFlow(value: number, hasData: boolean): string {
  if (!hasData || value === 0) return "—";
  return `$${value.toLocaleString()}/mo`;
}

function agentDotColor(status: string): string {
  switch (status) {
    case "active":
      return "#00C97A";
    case "scanning":
      return "#C9A84C";
    case "error":
      return "#E05252";
    default:
      return "#3A5068";
  }
}

function formatListPriceK(price: number | null): string {
  if (price == null) return "—";
  const k = price >= 1000 ? Math.round(price / 1000) : price;
  return `$${k}K`;
}

function formatAduRent(value: number | null | undefined): string {
  if (value == null || value === 0) return "—";
  return `$${value.toLocaleString()}/mo`;
}

function formatCoc(coc: number | null): string {
  if (coc == null) return "—";
  return coc.toFixed(1);
}

function formatCoverage(pct: number | null | undefined): string {
  if (pct == null || pct === 0) return "—";
  return `${pct.toFixed(0)}%`;
}

export function Dashboard({
  deals,
  cashflow,
  agents,
  maintenance,
  kpis,
}: DashboardProps) {
  const hasProperties = kpis.propertyCount > 0;
  const cocReturn =
    kpis.liquidCapital > 0
      ? ((kpis.monthlyCashFlow * 12) / kpis.liquidCapital) * 100
      : null;

  const kpiCards = [
    {
      label: "Properties",
      value: hasProperties ? String(kpis.propertyCount) : "—",
      gold: true,
      hint: hasProperties ? "active holdings" : undefined,
    },
    {
      label: "Portfolio value",
      value: formatCurrency(kpis.portfolioValue, hasProperties),
      gold: false,
    },
    {
      label: "Total equity",
      value: formatCurrency(kpis.totalEquity, hasProperties),
      gold: false,
    },
    {
      label: "Cash flow/mo",
      value: formatCashFlow(kpis.monthlyCashFlow, hasProperties),
      gold: false,
    },
    {
      label: "CoC return",
      value:
        cocReturn != null && hasProperties
          ? `${cocReturn.toFixed(1)}%`
          : "—",
      gold: false,
    },
    {
      label: "Liquid capital",
      value: formatCurrency(kpis.liquidCapital, kpis.liquidCapital > 0),
      gold: true,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="page-eyebrow">Sharlakian Holdings</p>
        <h1 className="page-title-display mt-1">
          Portfolio <span className="title-accent">Command</span> Center
        </h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((card) => (
          <div key={card.label} className="panel p-4">
            <p className="kpi-label">{card.label}</p>
            <p
              className={`kpi-value mt-2 ${
                card.gold && card.value !== "—" ? "kpi-value-gold" : ""
              } ${card.value === "—" ? "kpi-empty" : ""}`}
            >
              {card.value}
            </p>
            {card.hint && <p className="kpi-hint mt-1">{card.hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-4">
          <div className="panel p-5">
            <p className="panel-heading mb-4">Monthly Cash Flow</p>
            <CashFlowBarChart data={cashflow} />
          </div>

          <div className="panel p-5">
            <p className="panel-heading mb-4">Deal Pipeline</p>
            {!deals.length ? (
              <p className="empty-state py-8">
                NO DEALS IN PIPELINE — ADD YOUR FIRST DEAL TO GET STARTED
              </p>
            ) : (
              <div className="space-y-3">
                {deals.map((deal, index) => {
                  const score = deal.ai_score ?? 0;
                  const scoreHigh = score >= 80;
                  const dealKey = deal.id ?? `deal-${index}`;
                  const dealHref = deal.property_id
                    ? `/deals/${deal.property_id}`
                    : "/deals";
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
                          <p className="deal-address truncate">{deal.address ?? "—"}</p>
                          <p className="deal-meta mt-0.5">
                            {formatListPriceK(deal.list_price)} · CoC{" "}
                            {formatCoc(deal.coc_return)}% · ADU{" "}
                            {formatAduRent(deal.adu_rent_estimate)} · Coverage{" "}
                            {formatCoverage(deal.adu_coverage_pct)}
                            {deal.market ? ` · ${deal.market}` : ""}
                          </p>
                        </div>
                      </div>
                      {index === 0 ? (
                        <Link href={dealHref} className="btn-gold shrink-0">
                          Review
                        </Link>
                      ) : (
                        <Link href={dealHref} className="btn-muted shrink-0">
                          View
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <p className="panel-heading mb-4">Agent Status</p>
            {!agents.length ? (
              <p className="empty-state py-4">NO AGENTS REGISTERED</p>
            ) : (
              <div className="space-y-3">
                {agents.map((agent) => {
                  const dotColor = agentDotColor(agent.status);
                  return (
                    <div key={agent.id} className="flex items-center gap-2">
                      <span
                        className="shrink-0 rounded-full"
                        style={{
                          width: 5,
                          height: 5,
                          backgroundColor: dotColor,
                        }}
                      />
                      <span className="agent-name">{agent.agent_name}</span>
                      <span
                        className="agent-status-label ml-auto"
                        style={{ color: dotColor }}
                      >
                        {agent.status?.toUpperCase() ?? "IDLE"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="panel-divider my-4" />

            <p className="panel-heading mb-4">Maintenance</p>
            {!maintenance.length ? (
              <p className="empty-state-sm py-4">NO OPEN REQUESTS</p>
            ) : (
              <div className="space-y-3">
                {maintenance.map((req) => {
                  const isHigh =
                    req.priority === "high" || req.priority === "emergency";
                  return (
                    <div key={req.id} className="space-y-1">
                      <span
                        className={`maint-badge ${
                          isHigh ? "maint-badge-high" : "maint-badge-low"
                        }`}
                      >
                        {isHigh ? "HIGH" : "LOW"}
                      </span>
                      <p className="maint-title">{req.title ?? "—"}</p>
                      {req.unit && <p className="maint-unit">{req.unit}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
