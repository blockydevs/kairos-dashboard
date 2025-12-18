"use client";

import React from "react";
import { Loader } from "@/components/ui/loader";
import { getPairWhitelist } from "@/services/web3/pairWhitelistContract";
import {
  getDetailedTokenDataById,
  solidityAddressToTokenIdString,
  type TokenData,
} from "@/services/dex/saucerswapApi";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TokenMeta = {
  id: string;
  symbol: string;
  icon?: string;
};

type PairItem = {
  tokenIn: TokenMeta;
  tokenOut: TokenMeta;
};

const fallbackSymbol = (idOrAddr: string) =>
  (idOrAddr ?? "").slice(0, 6).toUpperCase();

export function ActivePairs() {
  const [pairs, setPairs] = React.useState<PairItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  type PnlDetails = {
    buyCount?: number;
    firstBuyDate?: string;
    lastBuyDate?: string;
    avgBuyPrice?: number;
    currentPrice?: number;
    currentDate?: string;
    inventoryUnits?: number;
  };

  type PnlEntry = {
    pnl: string; // e.g. "+1.23%" or "-4.56%"
    details?: PnlDetails;
  };
  const [pnlMap, setPnlMap] = React.useState<Record<string, PnlEntry>>({});

  React.useEffect(() => {
    let cancelled = false;

    const loadPairs = async () => {
      try {
        setLoading(true);
        const rawPairs = await getPairWhitelist();

        const enriched: PairItem[] = [];

        for (const p of rawPairs) {
          const inId = solidityAddressToTokenIdString(p.tokenIn);
          const outId = solidityAddressToTokenIdString(p.tokenOut);

          const [inMeta, outMeta] = await Promise.all([
            getDetailedTokenDataById(inId),
            getDetailedTokenDataById(outId),
          ]);

          let tokenInMeta: TokenMeta = {
            id: inId,
            symbol:
              (inMeta as TokenData | undefined)?.symbol || fallbackSymbol(inId),
            icon: (inMeta as TokenData | undefined)?.icon,
          };
          let tokenOutMeta: TokenMeta = {
            id: outId,
            symbol:
              (outMeta as TokenData | undefined)?.symbol ||
              fallbackSymbol(outId),
            icon: (outMeta as TokenData | undefined)?.icon,
          };

          const usdcId = process.env.NEXT_PUBLIC_USDC_TOKEN_ID;
          if (usdcId && (tokenInMeta.id === usdcId || tokenOutMeta.id === usdcId)) {
            if (tokenInMeta.id === usdcId && tokenOutMeta.id !== usdcId) {
              [tokenInMeta, tokenOutMeta] = [tokenOutMeta, tokenInMeta];
            }
          }

          const item: PairItem = {
            tokenIn: tokenInMeta,
            tokenOut: tokenOutMeta,
          };

          enriched.push(item);
        }

        if (!cancelled) setPairs(enriched);
      } catch {
        if (!cancelled) setPairs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadPnl = async () => {
      const url = process.env.NEXT_PUBLIC_PAIR_PNL_API_URL;
      if (!url) return;

      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch PnL");
        const data: Array<{
          tokenIn: string;
          tokenOut: string;
          pnl: string;
          details?: {
            buyCount?: number;
            firstBuyDate?: string;
            lastBuyDate?: string;
            avgBuyPrice?: number;
            currentPrice?: number;
            currentDate?: string;
            inventoryUnits?: number;
          };
        }> = await res.json();

        const map: Record<string, PnlEntry> = {};
        for (const e of data ?? []) {
          try {
            const inId = solidityAddressToTokenIdString(e.tokenIn);
            const outId = solidityAddressToTokenIdString(e.tokenOut);
            map[`${inId}-${outId}`] = {
              pnl: e.pnl,
              details: e.details,
            };
          } catch {
            // skip invalid entry
          }
        }

        if (!cancelled) setPnlMap(map);
      } catch {
        if (!cancelled) setPnlMap({});
      }
    };

    void loadPairs();
    void loadPnl();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        Active pairs
      </div>

      {loading ? (
        <div className="h-16 flex items-center justify-center">
          <Loader />
        </div>
      ) : pairs.length === 0 ? (
        <div className="text-xs text-muted-foreground/80">No pairs</div>
      ) : (
        <div className="flex flex-col divide-y divide-border/60 rounded-md border border-border/60 overflow-hidden">
          {pairs.map((pair, idx) => (
            <div
              key={`${pair.tokenIn.id}-${pair.tokenOut.id}-${idx}`}
              className="flex items-center gap-3 px-3 py-2 bg-card/40 hover:bg-muted/40 transition-colors"
            >
              {/* token in */}
              {pair.tokenIn.icon ? (
                <img
                  src={pair.tokenIn.icon}
                  alt={pair.tokenIn.symbol}
                  className="size-5 rounded-full"
                />
              ) : (
                <div className="size-5 rounded-full bg-muted" />
              )}
              <span className="text-sm font-medium">{pair.tokenIn.symbol}</span>

              <span className="text-muted-foreground text-sm">/</span>

              {/* token out */}
              {pair.tokenOut.icon ? (
                <img
                  src={pair.tokenOut.icon}
                  alt={pair.tokenOut.symbol}
                  className="size-5 rounded-full"
                />
              ) : (
                <div className="size-5 rounded-full bg-muted" />
              )}
              <span className="text-sm font-medium">
                {pair.tokenOut.symbol}
              </span>

              {(() => {
                const key = `${pair.tokenIn.id}-${pair.tokenOut.id}`;
                const revKey = `${pair.tokenOut.id}-${pair.tokenIn.id}`;
                const entry = pnlMap[key];
                const revEntry = pnlMap[revKey];

                let pnlStr: string | undefined;
                let details: PnlDetails | undefined;
                if (entry) {
                  pnlStr = entry.pnl;
                  details = entry.details;
                } else if (revEntry) {
                  const raw = parseFloat((revEntry.pnl || "").replace(/%/g, ""));
                  if (!Number.isNaN(raw)) {
                    const flipped = -raw;
                    pnlStr = `${flipped > 0 ? "+" : ""}${flipped.toFixed(2)}%`;
                  }
                  if (revEntry.details) {
                    const d = revEntry.details;
                    details = {
                      ...d,
                      avgBuyPrice:
                        typeof d.avgBuyPrice === "number" && d.avgBuyPrice !== 0
                          ? 1 / d.avgBuyPrice
                          : d.avgBuyPrice,
                      currentPrice:
                        typeof d.currentPrice === "number" && d.currentPrice !== 0
                          ? 1 / d.currentPrice
                          : d.currentPrice,
                    };
                  }
                }

                const cls =
                  "ml-auto text-xs font-semibold " +
                  (typeof pnlStr === "string"
                    ? pnlStr.includes("+")
                      ? "text-green-500"
                      : pnlStr.includes("-")
                      ? "text-red-500"
                      : "text-muted-foreground"
                    : "text-muted-foreground");

                const label = typeof pnlStr === "string" ? pnlStr : "—";

                const content = details ? (
                  <div className="space-y-1">
                    {typeof details.buyCount === "number" && (
                      <div>
                        <span className="text-muted-foreground">buyCount:</span> {details.buyCount}
                      </div>
                    )}
                    {details.firstBuyDate && (
                      <div>
                        <span className="text-muted-foreground">firstBuyDate:</span> {new Date(details.firstBuyDate).toLocaleString()}
                      </div>
                    )}
                    {details.lastBuyDate && (
                      <div>
                        <span className="text-muted-foreground">lastBuyDate:</span> {new Date(details.lastBuyDate).toLocaleString()}
                      </div>
                    )}
                    {typeof details.avgBuyPrice === "number" && (
                      <div>
                        <span className="text-muted-foreground">avgBuyPrice:</span> {details.avgBuyPrice.toFixed(6)}
                      </div>
                    )}
                    {typeof details.currentPrice === "number" && (
                      <div>
                        <span className="text-muted-foreground">currentPrice:</span> {details.currentPrice.toFixed(6)}
                      </div>
                    )}
                    {details.currentDate && (
                      <div>
                        <span className="text-muted-foreground">currentDate:</span> {new Date(details.currentDate).toLocaleString()}
                      </div>
                    )}
                    {typeof details.inventoryUnits === "number" && (
                      <div>
                        <span className="text-muted-foreground">inventoryUnits:</span> {details.inventoryUnits}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">No data</div>
                );

                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cls}>{label}</span>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>{content}</TooltipContent>
                  </Tooltip>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivePairs;
