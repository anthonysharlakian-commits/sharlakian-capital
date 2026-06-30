import { notFound } from "next/navigation";
import { getProperty, getMaintenanceRequests } from "@/lib/data/queries";
import { PropertyHeader } from "@/components/properties/property-header";
import { PropertyNav } from "@/components/properties/property-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getStatusDot, cn } from "@/lib/utils";

export default async function PropertyMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const maintenance = (await getMaintenanceRequests()).filter((m) => m.property_id === id);

  return (
    <div className="space-y-5">
      <PropertyHeader property={property} />
      <PropertyNav propertyId={id} />

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {maintenance.length === 0 ? (
            <p className="empty-state py-8">NO OPEN REQUESTS</p>
          ) : (
            maintenance.map((m) => (
              <div key={m.id} className="border-b border-[var(--border)] pb-4 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusDot(m.priority))} />
                      <p className="body-text">{m.title}</p>
                      <Badge variant={m.priority === "emergency" ? "danger" : m.priority === "high" ? "warning" : "secondary"}>
                        {m.priority}
                      </Badge>
                    </div>
                    <p className="caption-sm text-[var(--text-muted)] mt-1">{m.description}</p>
                    {m.ai_diagnosis && (
                      <p className="caption-sm text-[var(--gold)] mt-2">AI: {m.ai_diagnosis}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="capitalize">{m.status.replace(/_/g, " ")}</Badge>
                    {m.estimated_cost != null && (
                      <p className="caption-sm mt-2">
                        Est: {formatCurrency(m.estimated_cost)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
