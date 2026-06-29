import { getMaintenanceRequests, getProperties } from "@/lib/data/queries";
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
  const ownedProperties = properties.filter((p) => p.status === "owned");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {requests.filter((r) => r.status !== "completed" && r.status !== "closed").length} open requests
        </p>
      </div>

      <MaintenanceForm
        properties={
          ownedProperties.length > 0
            ? ownedProperties.map((p) => ({ id: p.id, address: p.address }))
            : properties.slice(0, 3).map((p) => ({ id: p.id, address: p.address }))
        }
      />

      <div className="space-y-3">
        {requests.map((m) => {
          const property = propertyMap[m.property_id];
          return (
            <Card key={m.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", getStatusDot(m.priority))} />
                      <p className="font-medium">{m.title}</p>
                      <Badge variant={m.priority === "emergency" ? "danger" : m.priority === "high" ? "warning" : "secondary"}>
                        {m.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{property?.address}</p>
                    {m.ai_diagnosis && (
                      <p className="text-xs mt-2 text-primary/80">AI: {m.ai_diagnosis}</p>
                    )}
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <Badge variant="outline" className="capitalize">{m.status.replace(/_/g, " ")}</Badge>
                    {m.estimated_cost && (
                      <p className="text-xs text-muted-foreground mt-2">Est: {formatCurrency(m.estimated_cost)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
