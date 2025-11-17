"use client";

import React, { useEffect, useState } from "react";
import { fetchInitialMessages, subscribeToNewMessages } from "@/services/hcs";
import { startBalancePolling } from "@/services/web3";
import { getDetailedTokenDataById, solidityAddressToTokenIdString, TokenData } from "@/services/dex/saucerswapApi";
import { getPairWhitelist } from "@/services/web3/pairWhitelistContract";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

function HcsMessages() {
  const [messages, setMessages] = useState<{ consensusTimestamp: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("-");
  const [balanceError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [page, setPage] = useState<number>(1);
  const pageSize = 5;

  useEffect(() => {
    let unsub: (() => void) | null = null;

    const fetchTokens = async () => {
      try {
        const pairs = await getPairWhitelist();
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
          setMessages((prev) => [m, ...prev]);
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


    const poll = startBalancePolling(
      (bal: string) => setBalance(bal)
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

  const totalPages = Math.ceil(messages.length / pageSize);
  const paginatedMessages = messages.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-50 dark:bg-black p-8 space-y-6 w-full">
      <h1 className="text-3xl font-bold w-full max-w-7xl">Hedera Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Treasury Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceError ? (
              <p className="text-red-600">Error: {balanceError}</p>
            ) : (
              <p className="text-lg">{balance}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SaucerSwap Tokens</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tokens.length === 0 && <p>No tokens loaded.</p>}
            {tokens.map((token) => (
              <Card key={token.id} className="p-2 flex flex-col items-center justify-center space-y-1">
                <img src={token.icon} alt={`${token.name} icon`} className="w-10 h-10" />
                <div className="text-sm font-semibold text-center">{token.symbol}</div>
                <div className="text-xs text-gray-500 text-center">${token.priceUsd.toFixed(6)}</div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="w-full max-w-7xl">
        <CardHeader>
          <CardTitle>Hedera Topic Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {!loading && !error && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMessages.map((m, idx) => (
                    <TableRow key={m.consensusTimestamp + ":" + idx}>
                      <TableCell className="text-xs text-gray-500">{m.consensusTimestamp}</TableCell>
                      <TableCell className="whitespace-pre-wrap break-words">{m.message}</TableCell>
                    </TableRow>
                  ))}
                  {paginatedMessages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2}>No messages.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  return <HcsMessages />;
}
