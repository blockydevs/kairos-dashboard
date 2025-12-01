import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimestamp, getTokenDetails } from "./utils";
import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Event {
  txHash?: string;
  timestamp: number;
  type: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string | number;
  amountOut?: string | number;
  htkReceived?: string | number;
  amount?: string | number;
}

interface EventsTableProps {
  rows: Event[];
  page: number;
  totalPages: number;
  pageSize: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  setPageSize: (size: number) => void;
}

function formatAmount(
  amount: string | number | undefined,
  decimals: number | null,
) {
  if (amount === undefined || amount === null || decimals === null) return "-";
  const value = Number(amount) / 10 ** decimals;
  if (isNaN(value)) return "-";
  return value.toFixed(4);
}

function mapEventType(ev: Event): {
  label: string;
  color:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "success"
    | "error"
    | "warning";
} {
  switch (ev.type) {
    case "SwapExecuted":
      if ((Number(ev.amountOut) ?? 0) > (Number(ev.amountIn) ?? 0)) {
        return { label: "BUY", color: "success" };
      } else {
        return { label: "SELL", color: "error" };
      }
    case "BuybackExecuted":
      return { label: "BUYBACK", color: "default" };
    case "Burned":
      return { label: "BURN", color: "warning" };
    default:
      return { label: "OTHER", color: "outline" };
  }
}

interface EventRowProps {
  ev: Event;
  idx: number;
}

const EventRow: React.FC<EventRowProps> = ({ ev, idx }) => {
  const [tokenInSymbol, setTokenInSymbol] = useState<string | null>(null);
  const [tokenInDecimals, setTokenInDecimals] = useState<number | null>(1);
  const [tokenOutSymbol, setTokenOutSymbol] = useState<string | null>(null);
  const [tokenOutDecimals, setTokenOutDecimals] = useState<number | null>(1);
  const eventType = useMemo(() => mapEventType(ev), [ev]);

  useEffect(() => {
    if (ev.tokenIn) {
      setTokenInSymbol("...");
      getTokenDetails(ev.tokenIn).then((t) => {
        setTokenInSymbol(t.symbol);
        setTokenInDecimals(t.decimals);
      });
    } else {
      setTokenInSymbol("-");
    }
  }, [ev.tokenIn]);

  useEffect(() => {
    if (ev.tokenOut) {
      setTokenOutSymbol("...");
      getTokenDetails(ev.tokenOut).then((t) => {
        setTokenOutSymbol(t.symbol);
        setTokenOutDecimals(t.decimals);
      });
    } else {
      setTokenOutSymbol("-");
    }
  }, [ev.tokenOut]);

  return (
    <TableRow key={ev.timestamp + ":" + idx} className="h-14">
      <TableCell className="text-sm text-muted-foreground">
        {formatTimestamp(ev.timestamp)}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={eventType.color} className="font-medium">
          {eventType.label}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        {ev.tokenIn ? (
          <a
            href={`${process.env.NEXT_PUBLIC_HASHSCAN_URL}/token/${ev.tokenIn}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-sm font-medium text-primary"
          >
            {tokenInSymbol}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {ev.tokenOut ? (
          <a
            href={`${process.env.NEXT_PUBLIC_HASHSCAN_URL}/token/${ev.tokenOut}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-sm font-medium text-primary"
          >
            {tokenOutSymbol}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-center text-sm">
        {formatAmount(ev.amountIn, tokenInDecimals)}
      </TableCell>
      <TableCell className="text-center text-sm">
        {formatAmount(ev.amountOut, tokenOutDecimals)}
      </TableCell>{" "}
      <TableCell className="text-center text-sm">
        {ev.htkReceived ?? <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell className="text-center text-sm">
        {ev.amount ?? <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell>
        <Button
          variant="gradient"
          size="sm"
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_HASHSCAN_URL}/transaction/${ev.txHash}`,
              "_blank",
            )
          }
          className="h-8"
        >
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default function EventsTable({
  rows,
  page,
  totalPages,
  pageSize,
  setPage,
  setPageSize,
}: EventsTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 font-semibold">Time</TableHead>
              <TableHead className="text-center h-12 font-semibold">
                Type
              </TableHead>
              <TableHead className="text-center h-12 font-semibold">
                Token In
              </TableHead>
              <TableHead className="text-center h-12 font-semibold">
                Token Out
              </TableHead>
              <TableHead className="text-center h-12 font-semibold">
                Amount In
              </TableHead>
              <TableHead className="text-center h-12 font-semibold">
                Amount Out
              </TableHead>
              <TableHead className="text-center h-12 font-semibold">
                HTK Received
              </TableHead>
              <TableHead className="text-center h-12 font-semibold">
                Amount Burned
              </TableHead>
              <TableHead className="w-[100px] h-12"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((ev, idx) => (
              <EventRow key={ev.timestamp + ":" + idx} ev={ev} idx={idx} />
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No events found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination className="w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={
                  page === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
                aria-disabled={page === 1}
              />
            </PaginationItem>

            {(() => {
              const pages = [];
              const maxVisible = 7;
              const total = totalPages || 1;

              if (total <= maxVisible) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else {
                if (page <= 4) {
                  for (let i = 1; i <= 5; i++) pages.push(i);
                  pages.push("...");
                  pages.push(total);
                } else if (page >= total - 3) {
                  pages.push(1);
                  pages.push("...");
                  for (let i = total - 4; i <= total; i++) pages.push(i);
                } else {
                  pages.push(1);
                  pages.push("...");
                  pages.push(page - 1);
                  pages.push(page);
                  pages.push(page + 1);
                  pages.push("...");
                  pages.push(total);
                }
              }

              return pages.map((p, idx) => {
                if (p === "...") {
                  return (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={page === p}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(Number(p));
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              });
            })()}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
                className={
                  page === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
                aria-disabled={page === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
