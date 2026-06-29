import { getTenants, getProperties } from "@/lib/data/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn, getStatusDot } from "@/lib/utils";

export default async function TenantsPage() {
  const [tenants, properties] = await Promise.all([getTenants(), getProperties()]);
  const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground text-sm mt-1">{tenants.length} active tenant records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tenants.map((t) => {
          const property = propertyMap[t.property_id];
          return (
            <Card key={t.id} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t.first_name} {t.last_name}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", getStatusDot(t.status))} />
                    <Badge variant="secondary" className="capitalize">{t.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{property?.address ?? "Unknown property"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-xs text-muted-foreground">Rent</p><p className="font-medium">{formatCurrency(t.monthly_rent)}/mo</p></div>
                  <div><p className="text-xs text-muted-foreground">Screening Score</p><p className="font-medium">{t.screening_score ?? "—"}/100</p></div>
                  <div><p className="text-xs text-muted-foreground">Lease Start</p><p>{t.lease_start}</p></div>
                  <div><p className="text-xs text-muted-foreground">Lease End</p><p>{t.lease_end}</p></div>
                </div>
                <p className="text-xs text-muted-foreground">{t.email} · {t.phone}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
