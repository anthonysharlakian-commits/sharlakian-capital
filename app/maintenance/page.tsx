import { getMaintenanceRequests, getProperties } from "@/lib/data/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { cn, formatCurrency, getStatusDot } from "@/lib/utils";

export default async function MaintenancePage() {
  const [requests, properties] = await Promise.all([
    getMaintenanceRequests(),
    getProperties(),
  ]);
  const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p]));
  const activeProperties = properties.filter(
    (p) => p.status === "active" || p.status === "owned"
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Maintenance"
        subtitle={`${requests.filter((r) => r.status !== "completed" && r.status !== "closed").length} open requests`}
      />

      <MaintenanceForm
        properties={activeProperties.map((p) => ({ id: p.id, address: p.address }))}
      />

      <div className="space-y-3">
        {requests.length === 0 ? (
          <p className="empty-state">NO OPEN REQUESTS</p>
        ) : (
          requests.map((m) => {
          const property = propertyMap[m.property_id];
          return (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusDot(m.priority))} />
                      <p className="body-text">{m.title}</p>
                      <Badge variant={m.priority === "emergency" ? "danger" : m.priority === "high" ? "warning" : "secondary"}>
                        {m.priority}
                      </Badge>
                    </div>
                    <p className="caption-sm text-[var(--text-muted)] mt-1">{m.description}</p>
                    <p className="caption-sm mt-2">{property?.address}</p>
                    {m.ai_diagnosis && (
                      <p className="caption-sm mt-2 text-[var(--gold)]">AI: {m.ai_diagnosis}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="capitalize">{m.status.replace(/_/g, " ")}</Badge>
                    {m.estimated_cost && (
                      <p className="caption-sm mt-2">Est: {formatCurrency(m.estimated_cost)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
        )}
      </div>
    </div>
  );
}
