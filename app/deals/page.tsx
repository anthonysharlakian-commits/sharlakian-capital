import { DealKanban } from "@/components/deals/deal-kanban";
import { DealsPipeline } from "@/components/deals/deals-pipeline";
import { AddDealForm } from "@/components/deals/add-deal-form";
import { PageHeader } from "@/components/layout/page-header";
import { getProperties, getDealAnalysesMap, getDeals } from "@/lib/data/queries";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const [properties, analyses, deals] = await Promise.all([
    getProperties(),
    getDealAnalysesMap(),
    getDeals(),
  ]);

  const pendingCount = properties.filter((p) => p.status === "pending_approval").length;
  const pipelineCount = deals.length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Deals"
        subtitle={
          pipelineCount > 0
            ? `${pipelineCount} deal${pipelineCount > 1 ? "s" : ""} in pipeline`
            : pendingCount > 0
              ? `${pendingCount} deal${pendingCount > 1 ? "s" : ""} awaiting your review`
              : "Run the scanner or add a deal to get started"
        }
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/agents">Run Scanner</Link>
          </Button>
        }
      />

      <DealsPipeline deals={deals} />

      <AddDealForm />

      {properties.length > 0 && (
        <DealKanban properties={properties} analyses={analyses} />
      )}
    </div>
  );
}
