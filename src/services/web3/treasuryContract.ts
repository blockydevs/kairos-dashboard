import { ContractId, TokenId } from "@hashgraph/sdk";
import { ethers } from "ethers";
import TreasuryAbi from "./abi/Treasury.json";

const TREASURY_CONTRACT_ID = process.env.NEXT_PUBLIC_HEDERA_TREASURY_CONTRACT_ID?.trim() || "";
const TREASURY_TOKEN_ID = process.env.NEXT_PUBLIC_TREASURY_TOKEN_ID?.trim() || "";
const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_TREASURY_POLL_INTERVAL_MS) || 5000;
const RPC_PROVIDER_URL = process.env.NEXT_PUBLIC_RPC_PROVIDER_URL?.trim() || "";

export interface GetBalanceOptions {
  tokenAddress?: string;
}

export interface PollHandle {
  stop: () => void;
}

function toSolidityAddress(addrOrId: string): string {
  const t = addrOrId.trim();
  if (t.startsWith("0.0.")) return TokenId.fromString(t).toSolidityAddress();
  if (t.startsWith("0x")) return t.toLowerCase();
  return t.toLowerCase();
}

function resolveTreasuryContractAddress(): string {
  return ContractId.fromString(TREASURY_CONTRACT_ID).toSolidityAddress();
}

export async function getBalance(
  providerOrSigner: ethers.Signer | ethers.providers.Provider,
  opts: GetBalanceOptions = {}
): Promise<string> {
  const tokenId = opts.tokenAddress?.trim() || TREASURY_TOKEN_ID;
  const tokenAddress = toSolidityAddress(tokenId);

  const contractAddress = resolveTreasuryContractAddress();
  const contract = new ethers.Contract(contractAddress, TreasuryAbi.abi, providerOrSigner);

  const result: ethers.BigNumber = await contract.getBalance(tokenAddress);
  return result.toString();
}

const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER_URL);

export function startBalancePolling(
  onUpdate: (balance: string) => void,
  opts: GetBalanceOptions = {}
): PollHandle {
  const intervalMs = POLL_INTERVAL_MS > 0 ? POLL_INTERVAL_MS : 5000;
  let active = true;

  const tick = async () => {
    if (!active) return;
    try {
      const bal = await getBalance(provider, opts);
      if (active) onUpdate(bal);
    } catch {}
  };

  void tick();
  const id = setInterval(tick, intervalMs);

  return {
    stop: () => {
      active = false;
      clearInterval(id as unknown as number);
    }
  };
}
