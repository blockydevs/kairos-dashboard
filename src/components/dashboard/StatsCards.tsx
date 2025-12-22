import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, Target } from "lucide-react";

interface PnlData {
  totalRealizedPnL: number;
  totalVolumeUsdc: number;
  tradesCount: number;
  winningTrades: number;
  tokenBreakdown: Record<
    string,
    { realizedPnL: number; openPositionQuantity: number; averageBuyPrice: number }
  >;
}

interface CagrDetails {
  totalReturnPercent: string;
  analysisPeriodDays: number;
  totalDepositsUsdc: string;
  totalWithdrawalsUsdc: string;
  currentValueUsdc: string;
}

export default function StatsCards({
  balance,
  cagr,
  hitRate,
  pnl,
  cagrDetails,
  isLoading,
  isError,
}: {
  balance: string | number;
  cagr: string | number;
  hitRate: string | number;
  pnl: PnlData | null;
  cagrDetails: CagrDetails | null;
  isLoading: boolean;
  isError: boolean;
}) {
  const isPositive = Number(cagr) >= 0;
  const colorClass = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const sign = isPositive ? "+" : "";

  const formatNumber = (value: string | number, decimals = 2) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num)
      ? "0.00"
      : num.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      <Card
        className={cn(
          "relative overflow-hidden border-2 border-border/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-500",
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 opacity-20 blur-3xl rounded-full" />

        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between">
            <div>
              <CardDescription className="text-sm font-medium text-muted-foreground mb-1">
                Total portfolio value in USD
              </CardDescription>
              <CardTitle className="text-base font-semibold">
                Portfolio Value
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-4xl font-bold mb-2 tracking-tight drop-shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center ">
                <Loader />
              </div>
            ) : isError ? (
              <div className="text-muted-foreground flex items-center justify-center text-sm">
                Cannot load data
              </div>
            ) : (
              <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                $
                {typeof balance === "number"
                  ? balance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                  : balance}
              </span>
            )}
          </div>
          {!isLoading && !isError && (
            <p className="text-xs text-muted-foreground font-medium">
              Total balance
            </p>
          )}
        </CardContent>
      </Card>

      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "relative overflow-hidden border-2 transition-all duration-500 hover:scale-[1.02] cursor-pointer",
              isPositive
                ? "border-green-500/20 hover:shadow-green-500/20 hover:shadow-lg"
                : "border-red-500/20 hover:shadow-red-500/20 hover:shadow-lg",
            )}
          >
            <div
              className={cn(
                "absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl rounded-full",
                isPositive ? "bg-green-500/10" : "bg-red-500/10",
              )}
            />

            <CardHeader className="pb-3 relative">
              <div className="flex items-start justify-between">
                <div>
                  <CardDescription className="text-sm font-medium text-muted-foreground mb-1">
                    Compound Annual Growth Rate
                  </CardDescription>
                  <CardTitle className="text-base font-semibold">CAGR</CardTitle>
                </div>
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                    isPositive
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : "bg-gradient-to-br from-red-500 to-red-600",
                  )}
                >
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div
                className={cn(
                  "text-4xl font-bold mb-2 tracking-tight drop-shadow-lg",
                  colorClass,
                )}
              >
                {sign}
                {typeof cagr === "number" ||
                  (typeof cagr === "string" && !isNaN(parseFloat(String(cagr))))
                  ? (() => {
                    const val =
                      typeof cagr === "number" ? cagr : parseFloat(String(cagr));
                    return Math.abs(val) > 1e6
                      ? val.toExponential(2)
                      : val.toFixed(2);
                  })()
                  : cagr}
                %{isLoading ? <Loader /> : null}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Annual growth
              </p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        {cagrDetails && (
          <TooltipContent
            side="bottom"
            className="max-w-xs p-4 bg-popover text-popover-foreground border border-border shadow-xl"
          >
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Profitability Analysis (XIRR):
                </p>
                <p>
                  Total Return (ROI):{" "}
                  <span className={Number(cagrDetails.totalReturnPercent) >= 0 ? "text-green-500" : "text-red-500"}>
                    {Number(cagrDetails.totalReturnPercent) >= 0 ? "+" : ""}
                    {formatNumber(cagrDetails.totalReturnPercent)}%
                  </span>{" "}
                  (all-time)
                </p>
                <p>Analysis Period: {cagrDetails.analysisPeriodDays} days</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Capital Flows:</p>
                <p>Total Deposits: {formatNumber(cagrDetails.totalDepositsUsdc)} USDC</p>
                <p>Total Withdrawals: {formatNumber(cagrDetails.totalWithdrawalsUsdc)} USDC</p>
                <p>Current Value: {formatNumber(cagrDetails.currentValueUsdc)} USDC</p>
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "relative overflow-hidden border-2 border-blue-500/20 hover:shadow-blue-500/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-500 cursor-pointer",
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 opacity-20 blur-3xl rounded-full" />

            <CardHeader className="pb-3 relative">
              <div className="flex items-start justify-between">
                <div>
                  <CardDescription className="text-sm font-medium text-muted-foreground mb-1">
                    Successful Trades
                  </CardDescription>
                  <CardTitle className="text-base font-semibold">
                    Hit Rate
                  </CardTitle>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold mb-2 tracking-tight text-blue-600 dark:text-blue-400 drop-shadow-lg">
                {typeof hitRate === "number" ||
                  (typeof hitRate === "string" && !isNaN(parseFloat(String(hitRate))))
                  ? (() => {
                    const val =
                      typeof hitRate === "number"
                        ? hitRate
                        : parseFloat(String(hitRate));
                    return val.toFixed(2);
                  })()
                  : hitRate}
                % {isLoading ? <Loader /> : null}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Trade success rate
              </p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        {pnl && (
          <TooltipContent
            side="bottom"
            className="max-w-xs p-4 bg-popover text-popover-foreground border border-border shadow-xl"
          >
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-1">Performance Details:</p>
                <p>
                  Hit Rate: {pnl.winningTrades} wins out of {pnl.tradesCount} closed positions
                </p>
                <p>
                  Realized PnL:{" "}
                  <span className={pnl.totalRealizedPnL >= 0 ? "text-green-500" : "text-red-500"}>
                    {pnl.totalRealizedPnL >= 0 ? "+" : ""}
                    {formatNumber(pnl.totalRealizedPnL)} USDC
                  </span>
                </p>
                <p>Total Volume: {formatNumber(pnl.totalVolumeUsdc)} USDC</p>
              </div>
              {Object.keys(pnl.tokenBreakdown).length > 0 && (
                <div>
                  <p className="font-semibold text-foreground mb-1">Token Breakdown:</p>
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    {Object.entries(pnl.tokenBreakdown).map(([token, data]) => (
                      <p key={token} className="text-xs">
                        <span className="font-mono">{truncateAddress(token)}</span> - realizedPnL:{" "}
                        <span className={data.realizedPnL >= 0 ? "text-green-500" : "text-red-500"}>
                          {data.realizedPnL >= 0 ? "+" : ""}
                          {formatNumber(data.realizedPnL)}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
