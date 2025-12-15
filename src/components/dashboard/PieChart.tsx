"use client";

import { PieChart, Pie, Cell, Tooltip, PieLabelRenderProps } from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";
import { Loader } from "@/components/ui/loader";

export interface PortfolioEntry {
  name: string;
  icon: string;
  value: number;
  color: string;
  amount: number;
  [key: string]: string | number;
}

const renderLabel = (props: PieLabelRenderProps, tokens: PortfolioEntry[]) => {
  const RADIAN = Math.PI / 180;
  const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, name = "" } = props;

  if (name === "None") return null;

  const radius = outerRadius + 35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const token = tokens.find((t) => t.name === name);
  if (!token || !token.icon) return null;

  return (
    <foreignObject x={x - 25} y={y - 10} width={40} height={40}>
      <img src={token.icon} alt={`${token.name} icon`} className="size-10" />
    </foreignObject>
  );
};

const EMPTY_DATA: PortfolioEntry[] = [
  {
    name: "None",
    icon: "",
    value: 1,
    color: "#e0e0e0",
    amount: 0,
  },
];

export function Chart() {
  const portfolioBreakdown = useDashboardStore(
    (state) => state.portfolioBreakdown,
  );
  const isLoading = useDashboardStore((state) => state.loading);
  const isError = useDashboardStore((state) => state.error);
  const tokens: PortfolioEntry[] = Array.isArray(portfolioBreakdown)
    ? (portfolioBreakdown as PortfolioEntry[])
    : [];
  const hasData = tokens.length > 0;
  const dataToDisplay: PortfolioEntry[] = hasData
    ? tokens.slice().sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
    : EMPTY_DATA;

  const totalValue = hasData
    ? tokens.reduce((sum, token) => sum + Number(token.value ?? 0), 0)
    : 1;

  if (isLoading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-muted-foreground h-[280px] flex items-center justify-center text-sm">
        Cannot load data
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-[280px] aspect-square flex items-center justify-center">
        <PieChart
          width={280}
          height={280}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          {hasData && (
            <Pie
              data={dataToDisplay}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={75}
              innerRadius={30}
              label={(props) => renderLabel(props, tokens)}
              labelLine={false}
            >
              {dataToDisplay.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          )}
          {hasData && (
            <Tooltip
              formatter={(_value, name) => {
                const item = tokens.find((i) => i.name === name);
                return [
                  `$${Number(item?.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  name,
                ];
              }}
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
            />
          )}
          {!hasData && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-2xl fill-muted-foreground font-medium"
            >
              None
            </text>
          )}
        </PieChart>
      </div>

      {hasData && (
        <div className="flex flex-col w-full space-y-3 pt-2">
          {dataToDisplay.map((token) => (
            <div
              key={token.name}
              className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <img
                src={token.icon}
                alt={token.name}
                className="size-5 shrink-0"
              />
              <span className="flex-1 text-sm font-medium">{token.name}</span>
              <span className="text-sm font-semibold text-muted-foreground">
                {totalValue > 0
                  ? ((token.value / totalValue) * 100).toFixed(1)
                  : "0.0"}
                %
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
