import { ContractId, TokenId } from "@hashgraph/sdk";
import { ethers } from "ethers";
import TreasuryAbi from "./abi/Treasury.json";
import {
  getDetailedTokenDataById,
  solidityAddressToTokenIdString,
} from "@/services/dex/saucerswapApi";

const TREASURY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_HEDERA_TREASURY_CONTRACT_ID?.trim() || "";
const POLL_INTERVAL_MS =
  Number(process.env.NEXT_PUBLIC_TREASURY_POLL_INTERVAL_MS) || 5000;
const RPC_PROVIDER_URL = process.env.NEXT_PUBLIC_RPC_PROVIDER_URL?.trim() || "";
const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER_URL);

export interface GetBalanceOptions {
  tokenAddress?: string;
}

export interface PollHandle {
  stop: () => void;
}

function toSolidityAddress(addrOrId: string): string {
  const t = addrOrId.trim();
  if (t.startsWith("0.0.")) return TokenId.fromString(t).toSolidityAddress();
  return t.toLowerCase();
}

function resolveTreasuryContractAddress(): string {
  return ContractId.fromString(TREASURY_CONTRACT_ID).toSolidityAddress();
}

export async function getBalance(
  providerOrSigner: ethers.Signer | ethers.providers.Provider,
  opts: GetBalanceOptions = {},
): Promise<string> {
  const tokenAddress = toSolidityAddress(opts.tokenAddress || "");
  const contractAddress = resolveTreasuryContractAddress();

  const contract = new ethers.Contract(
    contractAddress,
    TreasuryAbi.abi,
    providerOrSigner,
  );
  const result: ethers.BigNumber = await contract.getBalance(tokenAddress);

  return result.toString();
}

export function startBalancePolling(
  onUpdate: (balance: Record<string, number>) => void,
  opts: GetBalanceOptions[] = [{}],
): PollHandle {
  const intervalMs = POLL_INTERVAL_MS > 0 ? POLL_INTERVAL_MS : 5000;
  let active = true;

  const tick = async () => {
    if (!active) return;
    try {
      const balanceMap: Record<string, number> = {};
      const validOpts = opts.filter((opt) => opt.tokenAddress);

      for (const opt of validOpts) {
        console.log("Polling for balance of", opt.tokenAddress);
        const tokenId = solidityAddressToTokenIdString(opt.tokenAddress!);
        const tokenData = await getDetailedTokenDataById(tokenId);
        if (!tokenData) continue;
        const rawBalance = await getBalance(provider, {
          tokenAddress: opt.tokenAddress,
        });
        balanceMap[tokenData.id] = Number(rawBalance);
      }

      if (active) onUpdate(balanceMap);
    } catch {
      console.error("Error polling balances");
    }
  };

  void tick();
  const id = setInterval(tick, intervalMs);

  return {
    stop: () => {
      active = false;
      clearInterval(id as unknown as number);
    },
  };
}
