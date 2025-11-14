"use client";

import React, { useEffect, useState } from "react";
import { fetchInitialMessages, subscribeToNewMessages } from "@/services/hcs";

function HcsMessages() {
  const [messages, setMessages] = useState<{ consensusTimestamp: string; message: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => {
      try {
        unsub?.();
      } catch {}
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-50 font-sans dark:bg-black p-8 space-y-6">
      <h1 className="text-3xl font-bold">Hedera Topic Messages</h1>
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
