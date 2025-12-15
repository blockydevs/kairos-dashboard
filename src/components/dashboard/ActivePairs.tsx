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

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
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

          const item: PairItem = {
            tokenIn: {
              id: inId,
              symbol:
                (inMeta as TokenData | undefined)?.symbol ||
                fallbackSymbol(inId),
              icon: (inMeta as TokenData | undefined)?.icon,
            },
            tokenOut: {
              id: outId,
              symbol:
                (outMeta as TokenData | undefined)?.symbol ||
                fallbackSymbol(outId),
              icon: (outMeta as TokenData | undefined)?.icon,
            },
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

    void load();
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

              <span className="ml-auto text-xs font-semibold text-muted-foreground">
                PnL
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivePairs;
