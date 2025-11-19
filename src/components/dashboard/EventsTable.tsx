import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimestamp, getTokenSymbol } from "./utils";
import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Event {
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

function mapEventType(ev: Event): { label: string; color: "default" | "destructive" | "outline" | "secondary" | "success" | "error" | "warning" } {
  switch (ev.type) {
    case "SwapExecuted":
      if ((ev.amountOut ?? 0) > (ev.amountIn ?? 0)) {
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
  const [tokenOutSymbol, setTokenOutSymbol] = useState<string | null>(null);
  const eventType = useMemo(() => mapEventType(ev), [ev]);
  const mockTxHash = "0x1234567890abcdef1234567890abcdef12345678";

  useEffect(() => {
    if (ev.tokenIn) {
      setTokenInSymbol('...');
      getTokenSymbol(ev.tokenIn).then(setTokenInSymbol);
    } else {
      setTokenInSymbol('-');
    }
  }, [ev.tokenIn]);

  useEffect(() => {
    if (ev.tokenOut) {
      setTokenOutSymbol('...');
      getTokenSymbol(ev.tokenOut).then(setTokenOutSymbol);
    } else {
      setTokenOutSymbol('-');
    }
  }, [ev.tokenOut]);

  return (
    <TableRow key={ev.timestamp + ":" + idx} className="text-xs text-black-500">
      <TableCell className="text-xs text-gray-500">{formatTimestamp(ev.timestamp)}</TableCell>
      <TableCell className="text-center">
        <Badge variant={eventType.color}>{eventType.label}</Badge>
      </TableCell>
      <TableCell className="text-center">
        {ev.tokenIn ? (
          <a
            href={`https://hashscan.io/mainnet/token/${ev.tokenIn}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {tokenInSymbol}
          </a>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-center">
        {ev.tokenOut ? (
          <a
            href={`https://hashscan.io/mainnet/token/${ev.tokenOut}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {tokenOutSymbol}
          </a>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-center">{ev.amountIn ?? "-"}</TableCell>
      <TableCell className="text-center">{ev.amountOut ?? "-"}</TableCell>
      <TableCell className="text-center">{ev.htkReceived ?? "-"}</TableCell>
      <TableCell className="text-center">{ev.amount ?? "-"}</TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`https://hashscan.io/tx/${mockTxHash}`, "_blank")}
        >
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default function EventsTable({ rows, page, totalPages, pageSize, setPage, setPageSize }: EventsTableProps) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead className="text-center">Type</TableHead>
            <TableHead className="text-center">Token In</TableHead>
            <TableHead className="text-center">Token Out</TableHead>
            <TableHead className="text-center">Amount In</TableHead>
            <TableHead className="text-center">Amount Out</TableHead>
            <TableHead className="text-center">HTK Received</TableHead>
            <TableHead className="text-center">Amount Burned</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((ev, idx) => (
            <EventRow key={ev.timestamp + ":" + idx} ev={ev} idx={idx} />
          ))}

          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={9}>No events.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[100px]">
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
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}
