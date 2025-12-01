import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, Target } from "lucide-react";

export default function StatsCards({
  balance,
  cagr,
  hitRate,
  isLoading,
  isError,
}: {
  balance: string | number;
  cagr: string | number;
  hitRate: string | number;
  isLoading: boolean;
  isError: boolean;
}) {
  const isPositive = Number(cagr) >= 0;
  const colorClass = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const sign = isPositive ? "+" : "";

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

      <Card
        className={cn(
          "relative overflow-hidden border-2 transition-all duration-500 hover:scale-[1.02]",
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
            {cagr}%{isLoading ? <Loader /> : null}
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Annual growth
          </p>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "relative overflow-hidden border-2 border-blue-500/20 hover:shadow-blue-500/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-500",
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
            {hitRate}% {isLoading ? <Loader /> : null}
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Trade success rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
