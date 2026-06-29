import Link from "next/link";
import { getProperties } from "@/lib/data/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getStatusDot } from "@/lib/utils";
import { Building2 } from "lucide-react";

export default async function PropertiesPage() {
  const properties = await getProperties();
  const owned = properties.filter((p) => p.status === "owned");
  const pipeline = properties.filter((p) => !["owned", "dead", "rejected"].includes(p.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {owned.length} owned · {pipeline.length} in pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {properties.map((p) => (
          <Link key={p.id} href={`/properties/${p.id}`}>
            <Card className="glass-card hover:border-primary/30 transition-colors h-full">
              <div className="h-32 bg-secondary/50 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.address}</p>
                    <p className="text-xs text-muted-foreground">{p.city}, {p.state}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", getStatusDot(p.status))} />
                    <Badge variant="secondary" className="text-xs capitalize">{p.status.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Value</p>
                    <p className="font-medium">{formatCurrency(p.current_value ?? p.list_price)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rent</p>
                    <p className="font-medium">{formatCurrency(p.monthly_rent)}/mo</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium uppercase">{p.type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
