"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  fetchInitialMessages,
  subscribeToNewMessages,
  DecodedMessage,
} from "@/services/hcs";
import EventsTable from "./EventsTable";
import TreasuryPie from "./TreasuryPie";
import StatsCards from "./StatsCards";
import ProfitHistoryChart from "./ProfitHistoryChart";
import { parseMessage } from "./utils";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";

export default function Dashboard() {
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [cagr, setCagr] = useState(0);
  const [hitRate, setHitRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const {
    loadInitialData,
    tokens,
    balances,
    startPollingBalances,
    stopPolling,
    loading: isLoadingDashboardStore,
    error: isErrorDashboardStore,
  } = useDashboardStore();


  const totalUsd = useMemo(() => {
    return tokens.reduce((sum, t) => {
      const bal = balances[t.id] || 0;
      const price = t.priceUsd || 0;
      return sum + bal * price;
    }, 0);
  }, [tokens, balances]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_METRICS_ENDPOINT_URL!);
        if (!res.ok) {

          console.warn("Failed to fetch metrics endpoint");
          return;
        }

        const data = await res.json();
        setCagr(data.cagr);
        setHitRate(data.hitRate);
      } catch (err) {
        console.error("Error fetching metrics:", err);
        toast.error("Failed to fetch metrics", { id: "metrics-error" });
      }
    };

    fetchMetrics();
  }, []);

  useEffect(() => {
    loadInitialData().then(() => {
      startPollingBalances();
    });

    return () => {
      stopPolling();
    };
  }, [loadInitialData, startPollingBalances, stopPolling]);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const initial = await fetchInitialMessages(25);
        setMessages(initial);
        setLoading(false);

        const sub = subscribeToNewMessages((msg) => {
          setMessages((prev) => [msg, ...prev]);
        });
        unsub = sub.unsubscribe;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        setLoading(false);
        toast.error("Failed to fetch Mirror Node data", {
          id: "mirror-node-error",
        });
      }
    })();

    return () => unsub?.();
  }, []);

  const eventRows = messages.map(parseMessage);
  const totalPages = Math.ceil(eventRows.length / pageSize);
  const paginatedRows = eventRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-2 sm:px-2 lg:px-2 2xl:px-6 py-6 lg:py-8 max-w-8xl">
        <div className="space-y-4 lg:space-y-4">
          <div className="mb-10">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-gradient">
              Dashboard
            </h1>
          </div>

          <StatsCards
            balance={totalUsd}
            cagr={cagr}
            hitRate={hitRate}
            isLoading={isLoadingDashboardStore}
            isError={!!isErrorDashboardStore}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <TreasuryPie />
            </div>

            <div className="lg:col-span-3 space-y-4">
              <ProfitHistoryChart />

              <Card
                className={cn(
                  "relative overflow-hidden shadow-card hover:shadow-elegant transition-all duration-500 border-2 border-border/50",
                )}
              >
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full bg-indigo-500" />

                <CardHeader className="pb-4 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardDescription className="text-sm font-medium text-muted-foreground mb-1">
                        Real-time blockchain events
                      </CardDescription>
                      <CardTitle className="text-base font-semibold">
                        Hedera Topic Events
                      </CardTitle>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 relative">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-destructive">Error: {error}</p>
                    </div>
                  ) : (
                    <EventsTable
                      rows={paginatedRows}
                      page={page}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      setPage={setPage}
                      setPageSize={setPageSize}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}