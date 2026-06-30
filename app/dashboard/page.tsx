import { getDashboardData } from "@/lib/data/dashboard";
import { Dashboard } from "@/components/dashboard/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { properties, deals, cashflow, agents, maintenance, kpis } =
    await getDashboardData();

  return (
    <Dashboard
      properties={properties}
      deals={deals}
      cashflow={cashflow}
      agents={agents}
      maintenance={maintenance}
      kpis={kpis}
    />
  );
}
