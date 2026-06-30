import { notFound } from "next/navigation";
import { getProperty, getTenants } from "@/lib/data/queries";
import { PropertyHeader } from "@/components/properties/property-header";
import { PropertyNav } from "@/components/properties/property-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, getStatusDot, cn } from "@/lib/utils";

export default async function PropertyTenantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const tenants = (await getTenants()).filter((t) => t.property_id === id);

  return (
    <div className="space-y-5">
      <PropertyHeader property={property} />
      <PropertyNav propertyId={id} />

      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="empty-state py-8">NO TENANTS</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Lease End</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell>{t.unit ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(t.monthly_rent)}</TableCell>
                    <TableCell>{t.lease_end ?? "—"}</TableCell>
                    <TableCell>{t.screening_score ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", getStatusDot(t.status))} />
                        <span className="capitalize">{t.status}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
