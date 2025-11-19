import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {formatTimestamp, getTokenSymbol, shortenAddress} from "./utils";
import React, {useEffect, useMemo, useState} from "react";

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
      <TableCell>
        <Badge variant={eventType.color}>{eventType.label}</Badge>
      </TableCell>
      <TableCell>
        {ev.tokenIn ? `${shortenAddress(ev.tokenIn)}(${tokenInSymbol})` : "-"}
      </TableCell>
      <TableCell>
        {ev.tokenOut ? `${shortenAddress(ev.tokenOut)}(${tokenOutSymbol})` : "-"}
      </TableCell>
      <TableCell>{ev.amountIn ?? "-"}</TableCell>
      <TableCell>{ev.amountOut ?? "-"}</TableCell>
      <TableCell>{ev.htkReceived ?? "-"}</TableCell>
      <TableCell>{ev.amount ?? "-"}</TableCell>
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
            <TableHead>Type</TableHead>
            <TableHead>Token In</TableHead>
            <TableHead>Token Out</TableHead>
            <TableHead>Amount In</TableHead>
            <TableHead>Amount Out</TableHead>
            <TableHead>HTK Received</TableHead>
            <TableHead>Amount Burned</TableHead>
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
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="border rounded p-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span>Page {page} of {totalPages || 1}</span>
          <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </div>
      </div>
    </>
  );
}
