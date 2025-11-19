"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, PieLabelRenderProps } from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";

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

  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const token = tokens.find((t) => t.name === name);
  if (!token || !token.icon) return null;

  return (
    <foreignObject x={x - 10} y={y - 10} width={20} height={20}>
      <img src={token.icon} alt={`${token.name} icon`} className="w-5 h-5" />
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

function TreasuryPie() {
  const portfolioBreakdown = useDashboardStore((state) => state.portfolioBreakdown);
  const hasData = portfolioBreakdown.length > 0;
  const dataToDisplay = hasData ? portfolioBreakdown : EMPTY_DATA;

  const totalValue = hasData
    ? portfolioBreakdown.reduce((sum, token) => sum + token.value, 0)
    : 1;

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Treasury Balance</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="w-52 h-52">
          <PieChart width={200} height={170} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            {hasData && (
              <Pie
                data={dataToDisplay}
                dataKey="value"
                nameKey="name"
                cx="55%"
                cy="50%"
                outerRadius={60}
                label={(props) => renderLabel(props, portfolioBreakdown)}
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
                  const item = portfolioBreakdown.find((i) => i.name === name);
                  return [`$${item?.amount.toLocaleString()}`, name];
                }}
              />
            )}
            {!hasData && (
              <text
                x="55%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xl fill-current text-gray-500"
              >
                None
              </text>
            )}
          </PieChart>
        </div>

        {hasData && (
          <div className="flex flex-col w-full space-y-2">
            {dataToDisplay.map((token) => (
              <div key={token.name} className="flex items-center space-x-2">
                <img src={token.icon} alt={token.name} className="w-5 h-5" />
                <span className="flex-1">{token.name}</span>
                <span>{((token.value / totalValue) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}

        {!hasData && (
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center px-4">
            The Treasury contract does not contain tokens that exist on the pair whitelist.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(TreasuryPie);
