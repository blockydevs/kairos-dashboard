"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface ProfitData {
  timestamp: string | number;
  value: number;
}

type TimeRange = "1W" | "1M" | "6M" | "ALL";

export default function ProfitHistoryChart() {
  const [allData, setAllData] = useState<ProfitData[]>([]);
  const [data, setData] = useState<ProfitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = process.env.NEXT_PUBLIC_PROFIT_HISTORY_API_URL;
        console.log("Fetching profit history from:", endpoint);
        if (!endpoint) {
          throw new Error("Profit history endpoint not defined");
        }

        const res = await fetch(`${endpoint}?limit=1000`);
        if (!res.ok) {
          throw new Error("Failed to fetch profit history");
        }
        const jsonData = await res.json();

        // Handle new API structure with chartData property
        const chartData = jsonData.chartData || jsonData;

        const sortedData = chartData.sort(
          (a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        setAllData(sortedData);
        setData(sortedData);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (allData.length === 0) return;

    const now = new Date();
    let filteredData: ProfitData[];

    switch (selectedRange) {
      case "1W": {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = allData.filter(
          (d) => new Date(d.timestamp) >= oneWeekAgo,
        );
        break;
      }
      case "1M": {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = allData.filter(
          (d) => new Date(d.timestamp) >= oneMonthAgo,
        );
        break;
      }
      case "6M": {
        const sixMonthsAgo = new Date(
          now.getTime() - 180 * 24 * 60 * 60 * 1000,
        );
        filteredData = allData.filter(
          (d) => new Date(d.timestamp) >= sixMonthsAgo,
        );
        break;
      }
      case "ALL":
      default:
        filteredData = allData;
        break;
    }

    setData(filteredData);
  }, [selectedRange, allData]);

  const formatXAxis = (tickItem: string | number) => {
    const date = new Date(tickItem);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatYAxis = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const getYDomain = () => {
    if (!data || data.length === 0) return [0, 1] as [number, number];

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal;

    const PCT_PADDING = 0.1; // 10%
    const MIN_ABS_PADDING = 0.5;
    const MIN_TOTAL_RANGE = 1.0;

    if (range === 0) {
      const half = MIN_TOTAL_RANGE / 2;
      return [minVal - half, maxVal + half] as [number, number];
    }

    const pad = Math.max(range * PCT_PADDING, MIN_ABS_PADDING);
    const lower = minVal - pad;
    const upper = maxVal + pad;
    if (upper - lower < MIN_TOTAL_RANGE) {
      const center = (upper + lower) / 2;
      return [center - MIN_TOTAL_RANGE / 2, center + MIN_TOTAL_RANGE / 2] as [
        number,
        number,
      ];
    }
    return [lower, upper] as [number, number];
  };

  const trend =
    data.length > 1
      ? ((data[data.length - 1].value - data[0].value) / data[0].value) * 100
      : 0;

  return (
    <Card className="border-2 border-border/50 shadow-card hover:shadow-elegant transition-all duration-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Profit History</CardTitle>
            <CardDescription>
              {data.length > 0
                ? `${formatXAxis(data[0].timestamp)} - ${formatXAxis(data[data.length - 1].timestamp)}`
                : "Loading..."}
            </CardDescription>
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["1W", "1M", "6M", "ALL"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                  selectedRange === range
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              Loading chart data...
            </div>
          ) : error ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-destructive p-4 text-center">
              <p className="font-semibold">Error loading chart</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  left: 12,
                  right: 12,
                  top: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  strokeOpacity={0.2}
                />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatXAxis}
                  minTickGap={30}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatYAxis}
                  domain={getYDomain()}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Date
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {label ? new Date(label).toLocaleString() : ""}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Value
                              </span>
                              <span className="font-bold">
                                ${Number(payload[0].value).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  dataKey="value"
                  type="natural"
                  stroke="#8b5cf6" // Violet-500
                  strokeWidth={2}
                  dot={{
                    fill: "#8b5cf6",
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
