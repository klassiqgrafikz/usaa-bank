"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export function BalanceChart({
  data,
}: {
  data: { label: string; amount: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d4f91" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#1d4f91" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v) =>
              `$${(Number(v ?? 0) / 100).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}`
            }
            labelStyle={{ fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#1d4f91"
            strokeWidth={2}
            fill="url(#balanceFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}