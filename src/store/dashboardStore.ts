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

const WHBAR_ADDRESS_MAINNET = "0x0000000000000000000000000000000000163b5a";

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

      const treasuryId = process.env.NEXT_PUBLIC_HEDERA_TREASURY_CONTRACT_ID;
      if (!treasuryId) throw new Error("Missing Treasury ID in env");

      // Fetch all token balances and HBAR balance from Mirror Node
      const [mirrorTokenBalances, treasuryHbarTinybars] = await Promise.all([
        fetchTokenBalancesFromMirror(treasuryId),
        fetchHbarBalanceFromMirror(treasuryId),
      ]);

      if (!mirrorTokenBalances) {
        throw new Error("Failed to fetch token balances from Mirror Node");
      }

      const tokens: TokenData[] = [];
      const balances: Record<string, number> = {};
      const tokenColors: Record<string, string> = {};
      const addressSet = new Set<string>();

      // Get WHBAR token ID for later use
      const whbarTokenId = solidityAddressToTokenIdString(
        WHBAR_ADDRESS_MAINNET,
      );

      // Iterate over all tokens from Mirror Node (actual Treasury holdings)
      const tokenIds = Object.keys(mirrorTokenBalances);

      for (const tokenId of tokenIds) {
        if (addressSet.has(tokenId)) continue;
        addressSet.add(tokenId);

        const t = await getDetailedTokenDataById(tokenId);
        if (!t) {
          console.warn(`Could not fetch details for token ${tokenId}`);
          continue;
        }

        // Force USDC price to 1 USD
        const usdcTokenId = process.env.NEXT_PUBLIC_USDC_TOKEN_ID;
        if (usdcTokenId && t.id === usdcTokenId) {
          t.priceUsd = 1;
        }

        tokens.push(t);

        // Calculate balance with proper decimals
        const rawBalance = mirrorTokenBalances[tokenId];
        balances[t.id] = rawBalance / 10 ** t.decimals;

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

      // Add HBAR balance to WHBAR (for pricing consistency, like in other application)
      if (treasuryHbarTinybars > 0) {
        const hbarBalance = treasuryHbarTinybars / 100_000_000; // HBAR has 8 decimals

        // Check if WHBAR is already in tokens list
        const existingWhbar = tokens.find((t) => t.id === whbarTokenId);

        if (existingWhbar) {
          // Add HBAR balance to existing WHBAR balance
          balances[whbarTokenId] = (balances[whbarTokenId] || 0) + hbarBalance;
        } else {
          // WHBAR not in list, add it with just HBAR balance
          const whbarData = await getDetailedTokenDataById(whbarTokenId);
          if (whbarData) {
            tokens.push(whbarData);
            balances[whbarTokenId] = hbarBalance;
            tokenColors[whbarTokenId] = "#8259EF"; // Hedera purple
          }
        }
      }

      set({
        tokens,
        tokenAddresses: Array.from(addressSet),
        balances,
        tokenColors,
        loading: false,
      });
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
        fetchHbarBalanceFromMirror(treasuryId),
      ]);

      if (!mirrorTokenBalances) {
        console.warn(
          "Update balances failed: could not fetch from mirror node",
        );
        return;
      }

      const whbarTokenId = solidityAddressToTokenIdString(
        WHBAR_ADDRESS_MAINNET,
      );
      const newBalances: Record<string, number> = {};
      let changed = false;

      for (const t of tokens) {
        let val = 0;

        if (mirrorTokenBalances[t.id] !== undefined) {
          val = mirrorTokenBalances[t.id] / 10 ** t.decimals;
        }

        // Add HBAR balance to WHBAR
        if (t.id === whbarTokenId && treasuryHbarTinybars > 0) {
          val += treasuryHbarTinybars / 100_000_000;
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
