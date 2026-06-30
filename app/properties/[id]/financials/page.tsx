import { notFound } from "next/navigation";
import { getProperty, getTransactions } from "@/lib/data/queries";
import { PropertyHeader } from "@/components/properties/property-header";
import { PropertyNav } from "@/components/properties/property-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, cn } from "@/lib/utils";

export default async function PropertyFinancialsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const transactions = (await getTransactions()).filter((t) => t.property_id === id);
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount ?? 0), 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount ?? 0), 0);
  const net = income - expenses;

  return (
    <div className="space-y-5">
      <PropertyHeader property={property} />
      <PropertyNav propertyId={id} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="panel p-4">
          <p className="kpi-label">Income</p>
          <p className="kpi-value mt-2 text-[var(--green)]">{formatCurrency(income)}</p>
        </div>
        <div className="panel p-4">
          <p className="kpi-label">Expenses</p>
          <p className="kpi-value mt-2 text-[var(--red)]">{formatCurrency(expenses)}</p>
        </div>
        <div className="panel p-4">
          <p className="kpi-label">Net</p>
          <p className={cn("kpi-value mt-2", net >= 0 ? "kpi-value-gold" : "text-[var(--red)]")}>
            {formatCurrency(net)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="empty-state py-8">NO TRANSACTIONS</p>
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
  );
}
