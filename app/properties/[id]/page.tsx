import { notFound } from "next/navigation";
import Link from "next/link";
import { getProperty, getTenants, getMaintenanceRequests, getTransactions } from "@/lib/data/queries";
import { PropertyHeader } from "@/components/properties/property-header";
import { PropertyNav } from "@/components/properties/property-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, getStatusDot, cn } from "@/lib/utils";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const [allTenants, allMaintenance, allTransactions] = await Promise.all([
    getTenants(),
    getMaintenanceRequests(),
    getTransactions(),
  ]);

  const tenants = allTenants.filter((t) => t.property_id === id);
  const maintenance = allMaintenance.filter((m) => m.property_id === id);
  const transactions = allTransactions.filter((t) => t.property_id === id).slice(0, 5);

  return (
    <div className="space-y-5">
      <PropertyHeader property={property} />
      <PropertyNav propertyId={id} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tenants</CardTitle>
            <Link href={`/properties/${id}/tenants`} className="caption-xs text-[var(--gold)] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <p className="empty-state py-4">NO TENANTS</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.slice(0, 3).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.first_name} {t.last_name}</TableCell>
                      <TableCell>{formatCurrency(t.monthly_rent)}</TableCell>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Maintenance</CardTitle>
            <Link href={`/properties/${id}/maintenance`} className="caption-xs text-[var(--gold)] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {maintenance.length === 0 ? (
              <p className="empty-state py-4">NO OPEN REQUESTS</p>
            ) : (
              maintenance.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-start justify-between border-b border-[var(--border)] pb-3 last:border-0">
                  <div>
                    <p className="body-text">{m.title}</p>
                    <p className="caption-sm mt-0.5">{m.description}</p>
                  </div>
                  <Badge variant={m.priority === "emergency" ? "danger" : m.priority === "high" ? "warning" : "secondary"}>
                    {m.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link href={`/properties/${id}/financials`} className="caption-xs text-[var(--gold)] hover:underline">
              View ledger
            </Link>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="empty-state py-4">NO TRANSACTIONS</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell className="capitalize">{tx.category}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className={cn("text-right", tx.type === "income" ? "text-[var(--green)]" : "text-[var(--red)]")}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
