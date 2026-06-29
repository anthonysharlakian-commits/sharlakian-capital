import { notFound } from "next/navigation";
import Link from "next/link";
import { getProperty, getTenants, getMaintenanceRequests, getTransactions } from "@/lib/data/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, getStatusDot, cn } from "@/lib/utils";
import { Building2, Users, Wrench, DollarSign } from "lucide-react";

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
  const transactions = allTransactions.filter((t) => t.property_id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
          <Building2 className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{property.address}</h1>
          <p className="text-muted-foreground">{property.city}, {property.state} {property.zip}</p>
          <Badge variant="secondary" className="mt-2 capitalize">{property.status.replace(/_/g, " ")}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ["Current Value", formatCurrency(property.current_value)],
          ["Mortgage", formatCurrency(property.mortgage_balance)],
          ["Monthly Rent", formatCurrency(property.monthly_rent)],
          ["Equity", formatCurrency((property.current_value ?? 0) - (property.mortgage_balance ?? 0))],
        ].map(([label, value]) => (
          <Card key={label} className="glass-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tenants">
        <TabsList>
          <TabsTrigger value="tenants" className="gap-1"><Users className="h-3 w-3" /> Tenants</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1"><Wrench className="h-3 w-3" /> Maintenance</TabsTrigger>
          <TabsTrigger value="financials" className="gap-1"><DollarSign className="h-3 w-3" /> Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tenants</CardTitle>
              <Link href={`/properties/${id}/tenants`} className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tenants</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Lease End</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.first_name} {t.last_name}</TableCell>
                        <TableCell>{formatCurrency(t.monthly_rent)}</TableCell>
                        <TableCell>{t.lease_end}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("h-2 w-2 rounded-full", getStatusDot(t.status))} />
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
        </TabsContent>

        <TabsContent value="maintenance">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Maintenance Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {maintenance.map((m) => (
                <div key={m.id} className="flex items-start justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                  <Badge variant={m.priority === "emergency" ? "danger" : m.priority === "high" ? "warning" : "secondary"}>
                    {m.priority}
                  </Badge>
                </div>
              ))}
              {maintenance.length === 0 && <p className="text-sm text-muted-foreground">No requests</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Transaction Ledger</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <TableCell className={cn("text-right font-medium", tx.type === "income" ? "text-score-high" : "text-score-low")}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
