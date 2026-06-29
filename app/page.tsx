import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard, formatKpiCurrency, formatKpiPercent } from "@/components/dashboard/kpi-card";
import {
  CashFlowChart,
  EquityChart,
  IncomeExpenseChart,
} from "@/components/dashboard/charts";
import { MiniDealPipeline } from "@/components/deals/deal-kanban";
import { Badge } from "@/components/ui/badge";
import { getProperties, getMaintenanceRequests, getAgentLogs, getPortfolioKpis } from "@/lib/data/queries";
import {
  CASH_FLOW_CHART,
  EQUITY_CHART,
  INCOME_EXPENSE_CHART,
} from "@/lib/mock-data";
import { cn, formatCurrency, getStatusDot } from "@/lib/utils";
import {
  Building2,
  TrendingUp,
  Wallet,
  DollarSign,
  Percent,
  PiggyBank,
} from "lucide-react";

export default async function DashboardPage() {
  const [properties, maintenance, agentLogs, kpis] = await Promise.all([
    getProperties(),
    getMaintenanceRequests(),
    getAgentLogs(20),
    getPortfolioKpis(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sharlakian Holdings — closed-loop investment command center
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Properties" value={String(kpis.totalProperties)} icon={Building2} />
        <KpiCard title="Portfolio Value" value={formatKpiCurrency(kpis.totalPortfolioValue)} icon={TrendingUp} trend="up" subtitle="+4.5% YTD" />
        <KpiCard title="Total Equity" value={formatKpiCurrency(kpis.totalEquity)} icon={Wallet} trend="up" />
        <KpiCard title="Net Cash Flow" value={`${formatKpiCurrency(kpis.netMonthlyCashFlow)}/mo`} icon={DollarSign} trend="up" />
        <KpiCard title="CoC Return" value={formatKpiPercent(kpis.overallCoCReturn)} icon={Percent} trend="up" />
        <KpiCard title="Liquid Capital" value={formatKpiCurrency(kpis.liquidCapital)} icon={PiggyBank} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Monthly Cash Flow</CardTitle></CardHeader>
          <CardContent><CashFlowChart data={CASH_FLOW_CHART} /></CardContent>
        </Card>
        <Card className="glass-card lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Equity Growth</CardTitle></CardHeader>
          <CardContent><EquityChart data={EQUITY_CHART} /></CardContent>
        </Card>
        <Card className="glass-card lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Income vs Expenses</CardTitle></CardHeader>
          <CardContent><IncomeExpenseChart data={INCOME_EXPENSE_CHART} /></CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <MiniDealPipeline properties={properties} />

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Maintenance Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {maintenance.slice(0, 4).map((m) => (
              <div key={m.id} className="flex items-start gap-2 text-sm">
                <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", getStatusDot(m.priority))} />
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.status.replace(/_/g, " ")} · {m.priority}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agentLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium">{log.agent.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground"> · {log.action.replace(/_/g, " ")}</span>
                </div>
                <Badge variant={log.status === "success" ? "success" : log.status === "error" ? "danger" : "warning"}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lease Expirations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span>Maria Garcia — Apple Valley</span>
                <Badge variant="warning">May 2025</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">1 lease expiring in next 90 days</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
