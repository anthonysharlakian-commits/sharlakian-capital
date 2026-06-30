import Link from "next/link";
import { getProperties } from "@/lib/data/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getStatusDot } from "@/lib/utils";
import { Building2 } from "lucide-react";

export default async function PropertiesPage() {
  const properties = await getProperties();
  const owned = properties.filter((p) => p.status === "active" || p.status === "owned");
  const pipeline = properties.filter(
    (p) => !["active", "owned", "dead", "rejected"].includes(p.status)
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Properties"
        subtitle={`${owned.length} active · ${pipeline.length} in pipeline`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {properties.length === 0 ? (
          <p className="empty-state col-span-full">NO PROPERTIES IN PORTFOLIO</p>
        ) : (
          properties.map((p) => (
          <Link key={p.id} href={`/properties/${p.id}`}>
            <Card className="hover:border-[rgba(201,168,76,0.3)] transition-colors h-full">
              <div className="h-28 bg-[rgba(201,168,76,0.04)] flex items-center justify-center border-b border-[var(--border)]">
                <Building2 className="h-8 w-8 text-[var(--text-hint)]" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="body-text font-normal">{p.address}</p>
                    <p className="caption-sm mt-0.5">
                      {p.city}, {p.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", getStatusDot(p.status))} />
                    <Badge variant="secondary" className="capitalize">
                      {p.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 caption-sm">
                  <div>
                    <p className="text-[var(--text-hint)]">Value</p>
                    <p className="text-[var(--text-secondary)] mt-0.5">
                      {formatCurrency(p.current_value ?? p.list_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-hint)]">Rent</p>
                    <p className="text-[var(--text-secondary)] mt-0.5">
                      {formatCurrency(p.monthly_rent)}/mo
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-hint)]">Type</p>
                    <p className="text-[var(--text-secondary)] mt-0.5 uppercase">{p.type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
        )}
      </div>
    </div>
  );
}
