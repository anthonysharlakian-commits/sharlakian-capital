import { DealKanban } from "@/components/deals/deal-kanban";
import { getProperties, getDealAnalysesMap } from "@/lib/data/queries";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DealsPage() {
  const [properties, analyses] = await Promise.all([
    getProperties(),
    getDealAnalysesMap(),
  ]);

  const pendingCount = properties.filter((p) => p.status === "pending_approval").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deal Command Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pendingCount > 0
              ? `${pendingCount} deal${pendingCount > 1 ? "s" : ""} awaiting your review`
              : "All deals reviewed — agents scanning for new opportunities"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/agents/deal_scanner">Run Scanner</Link>
        </Button>
      </div>

      <DealKanban properties={properties} analyses={analyses} />
    </div>
  );
}
