import { create } from "zustand";
import {
  getDetailedTokenDataById,
  solidityAddressToTokenIdString,
  TokenData,
} from "@/services/dex/saucerswapApi";
import { getPairWhitelist } from "@/services/web3/pairWhitelistContract";
import { getBalance, startBalancePolling } from "@/services/web3/treasuryContract";
import { ethers } from "ethers";
import { PortfolioEntry } from "@/components/dashboard/TreasuryPie";

interface DashboardStore {
  tokens: TokenData[];
  tokenAddresses: string[];
  balances: Record<string, number>;
  tokenColors: Record<string, string>;
  portfolioBreakdown: PortfolioEntry[];
  loading: boolean;
  error: string | null;

  loadInitialData: () => Promise<void>;
  updateBalances: (provider: ethers.providers.JsonRpcProvider) => Promise<void>;
  refreshPortfolio: () => void;
  startPollingBalances: () => void;
  stopPolling: () => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  tokens: [],
  tokenAddresses: [],
  balances: {},
  tokenColors: {},
  portfolioBreakdown: [],
  loading: true,
  error: null,

  loadInitialData: async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_PROVIDER_URL);

      const pairs = await getPairWhitelist();
      const addressSet = new Set<string>();
      pairs.forEach(p => {
        addressSet.add(p.tokenIn);
        addressSet.add(p.tokenOut);
      });

      const tokenAddresses = Array.from(addressSet);
      const tokens: TokenData[] = [];
      const balances: Record<string, number> = {};
      const tokenColors: Record<string, string> = {};

      for (const addr of tokenAddresses) {
        const tokenId = solidityAddressToTokenIdString(addr);
        const t = await getDetailedTokenDataById(tokenId);
        if (!t) continue;

        tokens.push(t);

        const rawBal = await getBalance(provider, { tokenAddress: addr });
        balances[t.id] = Number(rawBal);

        const res = await fetch(`/api/utils/get-dominant-color-from-img-src?imgUrl=${encodeURIComponent(t.icon)}`);
        const json = await res.json();
        tokenColors[t.id] = json.color ?? "#e0e0e0";
      }

      set({ tokens, tokenAddresses, balances, tokenColors, loading: false });
      get().refreshPortfolio();
    } catch (e: any) {
      set({ error: e.message ?? "Unknown error", loading: false });
    }
  },

  updateBalances: async provider => {
    const { tokenAddresses, tokens } = get();
    const balances: Record<string, number> = {};

    for (const addr of tokenAddresses) {
      const tokenId = solidityAddressToTokenIdString(addr);
      const t = tokens.find(tt => tt.id === tokenId);
      if (!t) continue;

      const rawBal = await getBalance(provider, { tokenAddress: addr });
      balances[t.id] = Number(rawBal);
    }

    set({ balances });
    get().refreshPortfolio();
  },

  refreshPortfolio: () => {
    const { tokens, balances, tokenColors } = get();

    const portfolio = tokens.map(t => {
      const bal = balances[t.id] ?? 0;
      const usd = bal * (t.priceUsd ?? 0);

      return {
        name: t.symbol,
        icon: t.icon,
        value: usd,
        amount: usd,
        color: tokenColors[t.id] ?? "#e0e0e0"
      };
    });

    set({ portfolioBreakdown: portfolio });
  },

  startPollingBalances: () => {
    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_PROVIDER_URL);
    const { tokenAddresses, updateBalances } = get();
    if (!tokenAddresses.length) return;

    const poll = startBalancePolling(
      () => updateBalances(provider),
      tokenAddresses.map(addr => ({ tokenAddress: addr }))
    );

    set({ stopPolling: () => poll.stop() });
  },

  stopPolling: () => {}
}));
