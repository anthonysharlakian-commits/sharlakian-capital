"use client";

import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CashflowEntry } from "@/lib/types/dashboard";

function formatMonth(month: string | null | undefined): string {
  if (!month) return "—";
  if (typeof month !== "string") {
    const d = new Date(month as string);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short" });
    }
    return "—";
  }
  const parts = month.split("-");
  if (parts.length >= 2) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "short" });
  }
  const d = new Date(month);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "short" });
  }
  return month.slice(0, 3);
}

function barFill(entry: CashflowEntry): { fill: string; stroke?: string } {
  const value = entry.net_cashflow ?? 0;
  if (value === 0) {
    return { fill: "#0A1020", stroke: "rgba(201,168,76,0.2)" };
  }
  if (entry.is_projected) {
    return { fill: "rgba(201,168,76,0.35)" };
  }
  return { fill: "#C9A84C" };
}

export function CashFlowBarChart({ data }: { data: CashflowEntry[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[180px] px-4">
        <p className="empty-state">
          No cash flow data yet — updates when Deal 1 closes
        </p>
      </div>
    );
  }

  const chartData = data.map((entry) => ({
    ...entry,
    label: formatMonth(entry.month),
    value: entry.net_cashflow ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{
            fill: "#3A5068",
            fontSize: 9,
            fontFamily: "DM Sans, sans-serif",
          }}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, index) => {
            const style = barFill(entry);
            return (
              <Cell
                key={`cell-${index}`}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.stroke ? 1 : 0}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
