import { getTransactions, getProperties } from "@/lib/data/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, cn } from "@/lib/utils";

function displayAmount(value: number): string {
  if (value === 0) return "$0";
  return formatCurrency(value);
}

export default async function FinancesPage() {
  const [transactions, properties] = await Promise.all([
    getTransactions(),
    getProperties(),
  ]);
  const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p]));

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const net = totalIncome - totalExpenses;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Finances"
        subtitle="All income and expenses across portfolio"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="kpi-label">Total Income</p>
            <p
              className={cn(
                "kpi-value mt-2",
                totalIncome === 0 ? "text-[var(--text-muted)]" : "text-[var(--green)]"
              )}
            >
              {displayAmount(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="kpi-label">Total Expenses</p>
            <p
              className={cn(
                "kpi-value mt-2",
                totalExpenses === 0 ? "text-[var(--text-muted)]" : "text-[var(--red)]"
              )}
            >
              {displayAmount(totalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="kpi-label">Net</p>
            <p
              className={cn(
                "kpi-value mt-2",
                net === 0
                  ? "text-[var(--text-muted)]"
                  : net >= 0
                    ? "kpi-value-gold"
                    : "text-[var(--red)]"
              )}
            >
              {displayAmount(net)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="empty-state">NO TRANSACTIONS RECORDED</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {propertyMap[tx.property_id]?.address ?? "—"}
                    </TableCell>
                    <TableCell className="capitalize">{tx.category}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        tx.type === "income" ? "text-[var(--green)]" : "text-[var(--red)]"
                      )}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
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
