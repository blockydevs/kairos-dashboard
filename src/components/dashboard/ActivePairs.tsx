"use client";

import React from "react";
import { Loader } from "@/components/ui/loader";
import { getPairWhitelist } from "@/services/web3/pairWhitelistContract";
import {
  getDetailedTokenDataById,
  solidityAddressToTokenIdString,
  type TokenData,
} from "@/services/dex/saucerswapApi";

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
  type PnlEntry = {
    base: number;
    current: number;
    pct: number;
    addPairDate?: string;
    currentDate?: string;
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
          addPairDate?: string;
          priceInAddPairMoment: number | string;
          currentDate?: string;
          priceInCurrentMoment: number | string;
        }> = await res.json();

        const map: Record<string, PnlEntry> = {};
        for (const e of data ?? []) {
          try {
            const inId = solidityAddressToTokenIdString(e.tokenIn);
            const outId = solidityAddressToTokenIdString(e.tokenOut);
            const base =
              typeof e?.priceInAddPairMoment === "string"
                ? Number(e.priceInAddPairMoment)
                : e?.priceInAddPairMoment;
            const current =
              typeof e?.priceInCurrentMoment === "string"
                ? Number(e.priceInCurrentMoment)
                : e?.priceInCurrentMoment;
            if (
              typeof base === "number" &&
              base !== 0 &&
              typeof current === "number"
            ) {
              const pct = ((current - base) / base) * 100;
              map[`${inId}-${outId}`] = {
                base,
                current,
                pct,
                addPairDate: e.addPairDate,
                currentDate: e.currentDate,
              };
            }
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

                let pct: number | undefined;
                let base: number | undefined;
                let current: number | undefined;
                let addPairDate: string | undefined;
                let currentDate: string | undefined;

                if (entry) {
                  pct = entry.pct;
                  base = entry.base;
                  current = entry.current;
                  addPairDate = entry.addPairDate;
                  currentDate = entry.currentDate;
                } else if (revEntry) {
                  // Invert prices for reversed orientation
                  base = revEntry.base !== 0 ? 1 / revEntry.base : undefined;
                  current = revEntry.current !== 0 ? 1 / revEntry.current : undefined;
                  if (typeof base === "number" && base !== 0 && typeof current === "number") {
                    pct = ((current - base) / base) * 100;
                  }
                  addPairDate = revEntry.addPairDate;
                  currentDate = revEntry.currentDate;
                }

                const cls =
                  "ml-auto text-xs font-semibold " +
                  (typeof pct === "number"
                    ? pct > 0
                      ? "text-green-500"
                      : pct < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                    : "text-muted-foreground");

                const label =
                  typeof pct === "number"
                    ? `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`
                    : "—";

                const title =
                  typeof pct === "number" &&
                  typeof base === "number" &&
                  typeof current === "number"
                    ? `start date: ${addPairDate ? new Date(addPairDate).toLocaleString() : "—"}, start price: ${base.toFixed(6)}, current date: ${currentDate ? new Date(currentDate).toLocaleString() : "—"}, current price: ${current.toFixed(6)}`
                    : undefined;

                return (
                  <span className={cls} title={title}>
                    {label}
                  </span>
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
