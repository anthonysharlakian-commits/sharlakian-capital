import { getTenants, getProperties } from "@/lib/data/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn, getStatusDot } from "@/lib/utils";

export default async function TenantsPage() {
  const [tenants, properties] = await Promise.all([getTenants(), getProperties()]);
  const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p]));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tenants"
        subtitle={`${tenants.length} active tenant records`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tenants.length === 0 ? (
          <p className="empty-state col-span-full">NO TENANTS ON FILE</p>
        ) : (
          tenants.map((t) => {
          const property = propertyMap[t.property_id];
          return (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{t.first_name} {t.last_name}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", getStatusDot(t.status))} />
                    <Badge variant="secondary" className="capitalize">{t.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="caption-sm text-[var(--text-muted)]">{property?.address ?? "—"}</p>
                <div className="grid grid-cols-2 gap-2 caption-sm">
                  <div>
                    <p className="text-[var(--text-hint)]">Rent</p>
                    <p className="text-[var(--text-secondary)] mt-0.5">{formatCurrency(t.monthly_rent)}/mo</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-hint)]">Screening Score</p>
                    <p className="text-[var(--text-secondary)] mt-0.5">{t.screening_score ?? "—"}/100</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-hint)]">Lease Start</p>
                    <p className="text-[var(--text-secondary)] mt-0.5">{t.lease_start}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-hint)]">Lease End</p>
                    <p className="text-[var(--text-secondary)] mt-0.5">{t.lease_end}</p>
                  </div>
                </div>
                <p className="caption-sm">{t.email} · {t.phone}</p>
              </CardContent>
            </Card>
          );
        })
        )}
      </div>
    </div>
  );
}
