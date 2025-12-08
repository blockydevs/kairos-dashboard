import { create } from "zustand";
import {
  getDetailedTokenDataById,
  solidityAddressToTokenIdString,
  TokenData,
} from "@/services/dex/saucerswapApi";
import { getPairWhitelist } from "@/services/web3/pairWhitelistContract";
import { PortfolioEntry } from "@/components/dashboard/TreasuryPie";

interface DashboardStore {
  tokens: TokenData[];
  tokenAddresses: string[];
  balances: Record<string, number>;
  tokenColors: Record<string, string>;
  portfolioBreakdown: PortfolioEntry[];
  loading: boolean;
  error: string | null;
  _pollTimer: ReturnType<typeof setInterval> | null;

  loadInitialData: () => Promise<void>;
  updateBalances: () => Promise<void>;
  refreshPortfolio: () => void;
  startPollingBalances: () => void;
  stopPolling: () => void;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const WHBAR_ADDRESS = "0x0000000000000000000000000000000000163b5a";

const fetchTokenBalancesFromMirror = async (accountId: string) => {
  const mirrorUrl = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || "https://mainnet.mirrornode.hedera.com";
  try {
    const res = await fetch(`${mirrorUrl}/api/v1/accounts/${accountId}/tokens?limit=100`);
    if (!res.ok) return {};

    const data = await res.json();
    const balanceMap: Record<string, number> = {};

    data.tokens?.forEach((t: any) => {
      balanceMap[t.token_id] = t.balance;
    });

    return balanceMap;
  } catch (e) {
    console.error(e);
    return {};
  }
};

const fetchHbarBalanceFromMirror = async (accountId: string) => {
  const mirrorUrl = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || "https://mainnet-public.mirrornode.hedera.com";
  try {
    const res = await fetch(`${mirrorUrl}/api/v1/balances?account.id=${accountId}`);
    if (!res.ok) return 0;

    const data = await res.json();
    if (data.balances?.length > 0) {
      return data.balances[0].balance;
    }
    return 0;
  } catch (e) {
    console.error(e);
    return 0;
  }
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  tokens: [],
  tokenAddresses: [],
  balances: {},
  tokenColors: {},
  portfolioBreakdown: [],
  loading: true,
  error: null,
  _pollTimer: null,

  loadInitialData: async () => {
    try {
      if (get().tokens.length > 0) {
        set({ loading: false });
        get().refreshPortfolio();
        return;
      }

      const treasuryId = process.env.NEXT_PUBLIC_HEDERA_TREASURY_CONTRACT_ID;
      if (!treasuryId) throw new Error("Missing Treasury ID in env");

      const pairs = await getPairWhitelist();
      const addressSet = new Set<string>();
      pairs.forEach((p) => {
        addressSet.add(p.tokenIn);
        addressSet.add(p.tokenOut);
      });

      const tokenAddresses = Array.from(addressSet);
      const tokens: TokenData[] = [];
      const balances: Record<string, number> = {};
      const tokenColors: Record<string, string> = {};

      const [mirrorTokenBalances, treasuryHbarTinybars] = await Promise.all([
        fetchTokenBalancesFromMirror(treasuryId),
        fetchHbarBalanceFromMirror(treasuryId)
      ]);

      for (const addr of tokenAddresses) {
        const tokenId = solidityAddressToTokenIdString(addr);
        const t = await getDetailedTokenDataById(tokenId);
        if (!t) continue;

        tokens.push(t);

        if (
          addr.toLowerCase() === WHBAR_ADDRESS.toLowerCase() ||
          addr.toLowerCase() === ZERO_ADDRESS
        ) {
          balances[t.id] = treasuryHbarTinybars / 100_000_000;
        } else {
          const rawVal = mirrorTokenBalances[tokenId] || 0;
          balances[t.id] = rawVal / 10 ** t.decimals;
        }

        try {
          const res = await fetch(
            `/api/utils/get-dominant-color-from-img-src?imgUrl=${encodeURIComponent(t.icon)}`,
          );
          const json = await res.json();
          tokenColors[t.id] = json.color ?? "#e0e0e0";
        } catch {
          tokenColors[t.id] = "#e0e0e0";
        }
      }

      set({ tokens, tokenAddresses, balances, tokenColors, loading: false });
      get().refreshPortfolio();
    } catch (e: any) {
      set({ error: e.message ?? "Unknown error", loading: false });
    }
  },

  updateBalances: async () => {
    const { tokens, balances: currentBalances } = get();
    const treasuryId = process.env.NEXT_PUBLIC_HEDERA_TREASURY_CONTRACT_ID;
    if (!treasuryId) return;

    try {
      const [mirrorTokenBalances, treasuryHbarTinybars] = await Promise.all([
        fetchTokenBalancesFromMirror(treasuryId),
        fetchHbarBalanceFromMirror(treasuryId)
      ]);

      const whbarTokenId = solidityAddressToTokenIdString(WHBAR_ADDRESS);
      const zeroAddressTokenId = solidityAddressToTokenIdString(ZERO_ADDRESS);

      const newBalances: Record<string, number> = {};
      let changed = false;

      for (const t of tokens) {
        let val = 0;

        if (t.id === whbarTokenId || t.id === zeroAddressTokenId) {
          val = treasuryHbarTinybars / 100_000_000;
        } else {
          const raw = mirrorTokenBalances[t.id] || 0;
          val = raw / 10 ** t.decimals;
        }

        newBalances[t.id] = val;

        if (currentBalances[t.id] !== val) {
          changed = true;
        }
      }

      if (changed) {
        set({ balances: newBalances });
        get().refreshPortfolio();
      }
    } catch (e) {
      console.error(e);
    }
  },

  refreshPortfolio: () => {
    const {
      tokens,
      balances,
      tokenColors,
      portfolioBreakdown: currentPortfolio,
    } = get();

    const portfolio = tokens.map((t) => {
      const bal = balances[t.id] ?? 0;
      const usd = bal * (t.priceUsd ?? 0);

      return {
        name: t.symbol,
        icon: t.icon,
        value: usd,
        amount: usd,
        color: tokenColors[t.id] ?? "#e0e0e0",
      };
    });

    if (JSON.stringify(portfolio) === JSON.stringify(currentPortfolio)) {
      return;
    }

    set({ portfolioBreakdown: portfolio });
  },

  startPollingBalances: () => {
    const { updateBalances } = get();
    get().stopPolling();

    const intervalMs = Number(process.env.NEXT_PUBLIC_TREASURY_POLL_INTERVAL_MS) || 5000;

    const interval = setInterval(() => {
      updateBalances();
    }, intervalMs);

    set({ _pollTimer: interval });
  },

  stopPolling: () => {
    const { _pollTimer } = get();
    if (_pollTimer) {
      clearInterval(_pollTimer);
      set({ _pollTimer: null });
    }
  },
}));