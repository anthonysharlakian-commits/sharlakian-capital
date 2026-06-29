import { getTransactions, getProperties } from "@/lib/data/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, cn } from "@/lib/utils";

export default async function FinancesPage() {
  const [transactions, properties] = await Promise.all([
    getTransactions(),
    getProperties(),
  ]);
  const propertyMap = Object.fromEntries(properties.map((p) => [p.id, p]));

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Ledger</h1>
        <p className="text-muted-foreground text-sm mt-1">All income and expenses across portfolio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-score-high">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-score-low">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Net</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalIncome - totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">All Transactions</CardTitle></CardHeader>
        <CardContent>
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
                  <TableCell className="max-w-[200px] truncate">{propertyMap[tx.property_id]?.address ?? "—"}</TableCell>
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
    </div>
  );
}
