"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { ScoreBreakdown } from "@/lib/types/database";

const CHART_COLORS = {
  gold: "#C9A84C",
  green: "#22C55E",
  red: "#EF4444",
  grid: "#1e293b",
  text: "#94a3b8",
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    fontSize: "12px",
  },
};

export function CashFlowChart({ data }: { data: { month: string; cashFlow: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="month" stroke={CHART_COLORS.text} fontSize={12} />
        <YAxis stroke={CHART_COLORS.text} fontSize={12} tickFormatter={(v) => `$${v}`} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v}`, "Cash Flow"]} />
        <Line type="monotone" dataKey="cashFlow" stroke={CHART_COLORS.gold} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EquityChart({
  data,
}: {
  data: { month: string; equity: number; debt: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="month" stroke={CHART_COLORS.text} fontSize={12} />
        <YAxis stroke={CHART_COLORS.text} fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
        <Area type="monotone" dataKey="equity" stackId="1" stroke={CHART_COLORS.green} fill={CHART_COLORS.green} fillOpacity={0.3} />
        <Area type="monotone" dataKey="debt" stackId="1" stroke={CHART_COLORS.red} fill={CHART_COLORS.red} fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseChart({ data }: { data: { category: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="category" stroke={CHART_COLORS.text} fontSize={11} />
        <YAxis stroke={CHART_COLORS.text} fontSize={12} tickFormatter={(v) => `$${Math.abs(v)}`} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${Math.abs(v)}`, v >= 0 ? "Income" : "Expense"]} />
        <Bar dataKey="amount" fill={CHART_COLORS.gold} radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.amount >= 0 ? CHART_COLORS.green : CHART_COLORS.red}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreRadarChart({ breakdown }: { breakdown: ScoreBreakdown }) {
  const data = [
    { dimension: "Location", value: breakdown.location * 10 },
    { dimension: "Cash Flow", value: breakdown.cashflow * 10 },
    { dimension: "Appreciation", value: breakdown.appreciation * 10 },
    { dimension: "Condition", value: breakdown.condition * 10 },
    { dimension: "Financing", value: breakdown.financing * 10 },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid stroke={CHART_COLORS.grid} />
        <PolarAngleAxis dataKey="dimension" stroke={CHART_COLORS.text} fontSize={11} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={CHART_COLORS.text} fontSize={10} />
        <Radar dataKey="value" stroke={CHART_COLORS.gold} fill={CHART_COLORS.gold} fillOpacity={0.25} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
