import { create } from "zustand";
import {
  getDetailedTokenDataById,
  solidityAddressToTokenIdString,
  TokenData,
} from "@/services/dex/saucerswapApi";
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
const WHBAR_ADDRESS_MAINNET = "0x0000000000000000000000000000000000163b5a";
const WHBAR_ADDRESS_TESTNET = "0x0000000000000000000000000000000000003ad2";

const fetchTokenBalancesFromMirror = async (accountId: string) => {
  const mirrorUrl =
    process.env.NEXT_PUBLIC_MIRROR_NODE_URL ||
    "https://mainnet.mirrornode.hedera.com";
  try {
    const res = await fetch(
      `${mirrorUrl}/api/v1/accounts/${accountId}/tokens?limit=100`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const balanceMap: Record<string, number> = {};

    data.tokens?.forEach((t: any) => {
      balanceMap[t.token_id] = t.balance;
    });

    return balanceMap;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const fetchHbarBalanceFromMirror = async (accountId: string) => {
  const mirrorUrl =
    process.env.NEXT_PUBLIC_MIRROR_NODE_URL ||
    "https://mainnet-public.mirrornode.hedera.com";
  try {
    const res = await fetch(
      `${mirrorUrl}/api/v1/balances?account.id=${accountId}`,
    );
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

      const profitHistoryUrl = process.env.NEXT_PUBLIC_PROFIT_HISTORY_API_URL;
      if (!profitHistoryUrl) throw new Error("Profit history endpoint not defined");

      const treasuryId = process.env.NEXT_PUBLIC_HEDERA_TREASURY_CONTRACT_ID;
      if (!treasuryId) throw new Error("Missing Treasury ID in env");

      const res = await fetch(`${profitHistoryUrl}?limit=1`);
      if (!res.ok) throw new Error("Failed to fetch profit history");
      const jsonData = await res.json();

      const apiTokens = jsonData.tokens || [];

      if (!Array.isArray(apiTokens)) {
        console.warn("No tokens array found in profit-history response");
      }

      const [mirrorTokenBalances, treasuryHbarTinybars] = await Promise.all([
        fetchTokenBalancesFromMirror(treasuryId),
        fetchHbarBalanceFromMirror(treasuryId),
      ]);

      const tokens: TokenData[] = [];
      const balances: Record<string, number> = {};
      const tokenColors: Record<string, string> = {};
      const addressSet = new Set<string>();

      for (const apiToken of apiTokens) {
        const addr = apiToken.token;
        if (!addr || addressSet.has(addr.toLowerCase())) continue;
        addressSet.add(addr.toLowerCase());

        const tokenId = solidityAddressToTokenIdString(addr);
        const t = await getDetailedTokenDataById(tokenId);
        if (!t) {
          console.warn(`Could not fetch details for token ${tokenId} (${addr})`);
          continue;
        }

        tokens.push(t);

        if (
          addr.toLowerCase() === WHBAR_ADDRESS_MAINNET.toLowerCase() ||
          addr.toLowerCase() === ZERO_ADDRESS ||
          addr.toLowerCase() === WHBAR_ADDRESS_TESTNET.toLowerCase()
        ) {
          balances[t.id] = treasuryHbarTinybars / 100_000_000;
        } else {
          let val = 0;
          if (mirrorTokenBalances && mirrorTokenBalances[tokenId] !== undefined) {
            val = mirrorTokenBalances[tokenId] / 10 ** t.decimals;
          }
          balances[t.id] = val;
        }

        try {
          const resColor = await fetch(
            `/api/utils/get-dominant-color-from-img-src?imgUrl=${encodeURIComponent(t.icon)}`,
          );
          const jsonColor = await resColor.json();
          tokenColors[t.id] = jsonColor.color ?? "#e0e0e0";
        } catch {
          tokenColors[t.id] = "#e0e0e0";
        }
      }

      set({ tokens, tokenAddresses: Array.from(addressSet), balances, tokenColors, loading: false });
      get().refreshPortfolio();
    } catch (e: any) {
      set({ error: e.message ?? "Unknown error", loading: false });
    }
  },

  updateBalances: async () => {
    const { tokens, balances: currentBalances } = get();
    const treasuryId = process.env.NEXT_PUBLIC_HEDERA_TREASURY_CONTRACT_ID;
    const profitHistoryUrl = process.env.NEXT_PUBLIC_PROFIT_HISTORY_API_URL;

    if (!treasuryId) return;

    try {
      let apiTokens: any[] = [];
      if (profitHistoryUrl) {
        try {
          const apiRes = await fetch(`${profitHistoryUrl}?limit=1`);
          if (apiRes.ok) {
            const jsonData = await apiRes.json();
            apiTokens = jsonData.tokens || [];
          }
        } catch (err) {
          console.warn("Failed to fetch profit history in updateBalances", err);
        }
      }

      const [mirrorTokenBalances, treasuryHbarTinybars] = await Promise.all([
        fetchTokenBalancesFromMirror(treasuryId),
        fetchHbarBalanceFromMirror(treasuryId),
      ]);

      if (!mirrorTokenBalances) {
        console.warn("Update balances failed: could not fetch from mirror node");
        return;
      }

      const whbarTokenId_mainnet = solidityAddressToTokenIdString(WHBAR_ADDRESS_MAINNET);
      const whbarTokenId_testnet = solidityAddressToTokenIdString(WHBAR_ADDRESS_TESTNET);

      const zeroAddressTokenId = solidityAddressToTokenIdString(ZERO_ADDRESS);

      const newBalances: Record<string, number> = {};
      let changed = false;

      for (const t of tokens) {
        let val = 0;

        if (t.id === whbarTokenId_mainnet || t.id === zeroAddressTokenId || t.id === whbarTokenId_testnet) {
          if (treasuryHbarTinybars > 0) {
            val = treasuryHbarTinybars / 100_000_000;
          }
        } else {
          if (mirrorTokenBalances[t.id] !== undefined) {
            val = mirrorTokenBalances[t.id] / 10 ** t.decimals;
          }
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

    const intervalMs =
      Number(process.env.NEXT_PUBLIC_TREASURY_POLL_INTERVAL_MS) || 5000;

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
