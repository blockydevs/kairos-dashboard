"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chart } from "@/components/dashboard/PieChart";

export interface PortfolioEntry {
  name: string;
  icon: string;
  value: number;
  color: string;
  amount: number;
  [key: string]: string | number;
}

function TreasuryPie() {
  const treasuryContractId =
    process.env.NEXT_PUBLIC_HEDERA_TREASURY_CONTRACT_ID;
  const hashscanUrl = process.env.NEXT_PUBLIC_HASHSCAN_URL;

  return (
    <Card
      className={cn(
        "relative overflow-hidden shadow-card hover:shadow-elegant transition-all duration-500 border-2 border-border/50",
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full bg-emerald-500" />

      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between">
          <div>
            <CardDescription className="text-sm font-medium text-muted-foreground mb-1">
              Portfolio allocation
            </CardDescription>
            <CardTitle className="text-base font-semibold">
              Treasury Balance
            </CardTitle>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center space-y-6 pt-0 relative">
        <Chart />

        {treasuryContractId && (
          <div className="w-full pt-4">
            <Button
              variant="gradient"
              size="sm"
              onClick={() =>
                window.open(
                  `${hashscanUrl}/contract/${treasuryContractId}`,
                  "_blank",
                )
              }
              className="w-full h-9"
            >
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(TreasuryPie);
