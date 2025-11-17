"use client";

import React, { useEffect, useState } from "react";
import { fetchInitialMessages, subscribeToNewMessages } from "@/services/hcs";
import { startBalancePolling } from "@/services/web3";
import {getDetailedTokenDataById, solidityAddressToTokenIdString, TokenData} from "@/services/dex/saucerswapApi";
import {getPairWhitelist} from "@/services/web3/pairWhitelistContract";

function HcsMessages() {
  const [messages, setMessages] = useState<{ consensusTimestamp: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("-");
  const [balanceError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenData[]>([]);

  useEffect(() => {
    // HCS messages
    let unsub: (() => void) | null = null;

    const fetchTokens = async () => {
      try {
        const pairs = await getPairWhitelist();
        console.log("Fetched pairs:", pairs);

        const tokenAddressSet = new Set<string>();
        pairs.forEach(p => {
          tokenAddressSet.add(p.tokenIn);
          tokenAddressSet.add(p.tokenOut);
        });

        const tokenAddressList = Array.from(tokenAddressSet);
        const mockedToken = "0x00000000000000000000000000000000000b2ad5"; // TODO: remove this when we have real tokens
        tokenAddressList.push(mockedToken);

        const tokensArr: TokenData[] = [];
        for (const tokenAddress of tokenAddressList) {
          try {
            const tokenId = solidityAddressToTokenIdString(tokenAddress);
            const tokenData = await getDetailedTokenDataById(tokenId);
            tokensArr.push(tokenData);
          } catch (e) {
            console.error("Error fetching token data:", e);
          }
        }

        setTokens(tokensArr);
      } catch (err) {
        console.error(err);
      }
    };

    (async () => {
      try {
        const initial = await fetchInitialMessages(25);
        setMessages(initial);
        setLoading(false);
        const sub = subscribeToNewMessages((m) => {
          setMessages((prev) => [...prev, m]);
        });
        unsub = sub.unsubscribe;

        await fetchTokens();
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        setLoading(false);
      }
    })();

    // Treasury contract balance
    const poll = startBalancePolling(
      (bal: string) => {
        console.log("balance updated:", bal);
        setBalance(bal);
      },
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
      <h2 className="text-2xl font-semibold">SaucerSwap Tokens</h2>
      {tokens.length === 0 && <p>No tokens loaded.</p>}
      <ul className="w-full max-w-3xl space-y-4">
        {tokens.map((token) => (
          <li key={token.id} className="flex items-center space-x-4 p-4 border rounded bg-white dark:bg-gray-900">
            <img src={token.icon} alt={`${token.name} icon`} className="w-10 h-10" />
            <div className="flex-1">
              <div className="text-lg font-semibold">{token.name} ({token.symbol})</div>
              <div>Price USD: ${token.priceUsd.toFixed(6)}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return <HcsMessages />;
}
