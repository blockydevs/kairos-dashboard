"use client";

import React, { useEffect, useState } from "react";
import { fetchInitialMessages, subscribeToNewMessages, DecodedMessage } from "@/services/hcs";
import EventsTable from "./EventsTable";
import TreasuryPie from "./TreasuryPie";
import StatsCards from "./StatsCards";
import { parseMessage } from "./utils";
import { useDashboardStore } from "@/store/dashboardStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const {
    loadInitialData,
    tokens,
    balances,
    startPollingBalances,
    stopPolling
  } = useDashboardStore();

  const totalUsd = tokens.reduce((sum, t) => {
    const bal = balances[t.id] || 0;
    return sum + bal * (t.priceUsd || 0);
  }, 0);

  useEffect(() => {
    loadInitialData().then(() => {
      startPollingBalances();
    });

    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const initial = await fetchInitialMessages(25);
        setMessages(initial);
        setLoading(false);

        const sub = subscribeToNewMessages(msg => {
          setMessages(prev => [msg, ...prev]);
        });
        unsub = sub.unsubscribe;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        setLoading(false);
      }
    })();

    return () => unsub?.();
  }, []);

  const eventRows = messages.map(parseMessage);
  const totalPages = Math.ceil(eventRows.length / pageSize);
  const paginatedRows = eventRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 dark:bg-black p-8 space-y-6 w-full">
      <StatsCards balance={totalUsd} />

      <div className="grid grid-cols-4 gap-4 w-full max-w-7xl">
        <TreasuryPie />

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Hedera Topic Events</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-600">Error: {error}</p>
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
  );
}
