"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import ActivePairs from "@/components/dashboard/ActivePairs";
import {
  getRiskParameters,
  type RiskParameters,
} from "@/services/web3/parameterStoreContract";
import { Loader } from "@/components/ui/loader";

function TradingParameters() {
  const [risk, setRisk] = React.useState<RiskParameters | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [sysLoading, setSysLoading] = React.useState<boolean>(true);
  const [systemInfo, setSystemInfo] = React.useState<{
    AI_MODEL?: string;
    tradeInterval?: string;
    HEDERA_OPERATOR_ID?: string;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const params = await getRiskParameters();
        if (!cancelled) setRisk(params);
      } catch {
        if (!cancelled) setRisk(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const loadSystemInfo = async () => {
      const url = process.env.NEXT_PUBLIC_SYSTEM_INFO_API_URL?.trim();
      if (!url) {
        setSystemInfo(null);
        setSysLoading(false);
        return;
      }
      try {
        setSysLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch system info");
        const data = (await res.json()) as {
          AI_MODEL?: string;
          tradeInterval?: string;
          HEDERA_OPERATOR_ID?: string;
        };
        if (!cancelled) setSystemInfo(data);
      } catch {
        if (!cancelled) setSystemInfo(null);
      } finally {
        if (!cancelled) setSysLoading(false);
      }
    };
    void loadSystemInfo();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatBps = (bps?: number) =>
    typeof bps === "number" ? `${(bps / 100).toFixed(1)}%` : "-";

  const formatSeconds = (sec?: number) => {
    if (typeof sec !== "number") return "-";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const parts: string[] = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (s || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
  };

  const humanizeCron = (expr?: string) => {
    if (!expr || typeof expr !== "string") return "-";
    const parts = expr.trim().split(/\s+/);
    const every = (v: string) => {
      const m = v.match(/^\*\/(\d+)$/);
      return m ? parseInt(m[1], 10) : null;
    };
    const isNumber = (v: string) => /^\d+$/.test(v);

    // With seconds field (6-part cron): sec min hour dom mon dow
    if (parts.length === 6) {
      const [sec, min, hour] = parts;
      const sEvery = every(sec);
      if (sEvery) return `every ${sEvery} seconds`;
      if (sec === "0") {
        const mEvery = every(min);
        if (mEvery) return `every ${mEvery} minutes`;
        if (min === "0") {
          const hEvery = every(hour);
          if (hEvery) return `every ${hEvery} hours`;
          if (isNumber(hour)) {
            const hh = String(hour).padStart(2, "0");
            return `every day at ${hh}:00:00`;
          }
        }
      }
      return expr; // fallback to raw
    }

    // Standard 5-part cron: min hour dom mon dow
    if (parts.length === 5) {
      const [min, hour] = parts;
      const mEvery = every(min);
      if (mEvery) return `every ${mEvery} minutes`;
      if (min === "0") {
        const hEvery = every(hour);
        if (hEvery) return `every ${hEvery} hours`;
        if (isNumber(hour)) {
          const hh = String(hour).padStart(2, "0");
          return `every day at ${hh}:00`;
          return `every day at ${hh}:00`;
        }
      }
      return expr;
    }

    return expr;
  };

  const hashscanBase =
    process.env.NEXT_PUBLIC_HASHSCAN_URL?.replace(/\/+$/, "") ||
    "https://hashscan.io/mainnet";
  const operatorId = systemInfo?.HEDERA_OPERATOR_ID?.trim();
  const operatorUrl = operatorId
    ? `${hashscanBase}/account/${operatorId}`
    : undefined;

  return (
    <Card
      className={cn(
        "relative overflow-hidden shadow-card hover:shadow-elegant transition-all duration-500 border-2 border-border/50",
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full bg-amber-500" />

      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between">
          <div>
            <CardDescription className="text-sm font-medium text-muted-foreground mb-1">
              Trading parameters
            </CardDescription>
            <CardTitle className="text-base font-semibold"></CardTitle>
          </div>
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
            <SlidersHorizontal className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ActivePairs />

        <div className="mt-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Risk configuration
          </div>

          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <Loader />
            </div>
          ) : !risk ? (
            <div className="text-xs text-muted-foreground/80">
              Cannot load risk parameters
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/60 rounded-md border border-border/60 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-card/40">
                <span className="text-sm text-muted-foreground">
                  Max trade size
                </span>
                <span className="text-sm font-medium">
                  {formatBps(risk.maxTradeBps)}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-card/40">
                <span className="text-sm text-muted-foreground">
                  Max slippage
                </span>
                <span className="text-sm font-medium">
                  {formatBps(risk.maxSlippageBps)}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-card/40">
                <span className="text-sm text-muted-foreground">
                  Trade cooldown
                </span>
                <span className="text-sm font-medium">
                  {formatSeconds(risk.tradeCooldownSec)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            System information
          </div>

          {sysLoading ? (
            <div className="h-16 flex items-center justify-center">
              <Loader />
            </div>
          ) : !systemInfo ? (
            <div className="text-xs text-muted-foreground/80">
              Cannot load system info
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/60 rounded-md border border-border/60 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-card/40">
                <span className="text-sm text-muted-foreground">AI model</span>
                <span className="text-sm font-medium">
                  {systemInfo.AI_MODEL || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-card/40">
                <span className="text-sm text-muted-foreground">
                  Trade interval
                </span>
                <span className="text-sm font-medium flex items-center gap-2">
                  {humanizeCron(systemInfo.tradeInterval)}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-card/40">
                <span className="text-sm text-muted-foreground">
                  Operator ID
                </span>
                <span className="text-sm font-medium">
                  {operatorId ? (
                    <a
                      href={operatorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline underline-offset-4"
                    >
                      {operatorId}
                    </a>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(TradingParameters);
