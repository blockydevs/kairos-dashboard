"use client";

import React, { useEffect, useState } from "react";
import { fetchInitialMessages, subscribeToNewMessages } from "@/services/hcs";
import { startBalancePolling } from "@/services/web3";

function HcsMessages() {
  const [messages, setMessages] = useState<{ consensusTimestamp: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("-");
  const [balanceError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const initial = await fetchInitialMessages(25);
        setMessages(initial);
        setLoading(false);
        const sub = subscribeToNewMessages((m) => {
          setMessages((prev) => [...prev, m]);
        });
        unsub = sub.unsubscribe;
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        setLoading(false);
      }
    })();
    const poll = startBalancePolling(
      (bal) => {
        console.log("balance updated:", bal);
        setBalance(bal);
      },
      {}
    );
    return () => {
      try {
        unsub?.();
        poll.stop();
      } catch {
        console.error("Error stopping balance polling");
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-50 font-sans dark:bg-black p-8 space-y-6">
      <h1 className="text-3xl font-bold">Hedera Dashboard</h1>
      <div className="w-full max-w-3xl">
        <h2 className="text-2xl font-semibold">Treasury Balance</h2>
        {balanceError ? (
          <p className="text-red-600">Error: {balanceError}</p>
        ) : (
          <p className="text-lg mt-1">{balance}</p>
        )}
      </div>
      <h2 className="text-2xl font-semibold">Hedera Topic Messages</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && (
        <ul className="w-full max-w-3xl space-y-2">
          {messages.map((m, idx) => (
            <li key={m.consensusTimestamp + ":" + idx} className="rounded border p-3">
              <div className="text-xs text-gray-500">{m.consensusTimestamp}</div>
              <div className="whitespace-pre-wrap break-words">{m.message}</div>
            </li>
          ))}
          {messages.length === 0 && <li>No messages.</li>}
        </ul>
      )}
    </div>
  );
}

export default function Home() {
  return <HcsMessages />;
}
