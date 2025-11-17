import {TokenId} from "@hashgraph/sdk";
import Treasury from "./abi/Treasury.json";

const TREASURY_CONTRACT_ID = process.env.HEDERA_TREASURY_CONTRACT_ID!.trim();
const PUBLIC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_TOKEN_ADDRESS!.trim();
const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_TREASURY_POLL_INTERVAL_MS!);
const MIRROR_NODE_URL = process.env.NEXT_PUBLIC_MIRROR_NODE_URL!.replace(/\/$/, "")!;

let cachedTreasuryEvmAddress: string | null = null;

function toSolidityAddress(addrOrId: string): string {
  const trimmed = addrOrId.trim();
  if (trimmed.startsWith("0.0.")) {
    return TokenId.fromString(trimmed).toEvmAddress();
  }
  if (trimmed.startsWith("0x")) {
    return trimmed.slice(2).toLowerCase();
  }
  return trimmed.toLowerCase();
}

export interface GetBalanceOptions {
  tokenAddress?: string;
}

export async function getBalance(opts: GetBalanceOptions = {}): Promise<string> {
  const token = opts.tokenAddress?.trim() || PUBLIC_TOKEN_ADDRESS;
  const solidityToken = toSolidityAddress(token);

  const to = await getTreasuryEvmAddress();
  const data = encodeGetBalanceCall(solidityToken);

  const res = await mirrorEthCall({ to, data, gas: 200_000 });
  const hex = res.startsWith("0x") ? res.slice(2) : res;
  const value = BigInt("0x" + (hex || "0"));
  return value.toString();
}

export interface PollHandle {
  stop: () => void;
}

export function startBalancePolling(
  onUpdate: (balance: string) => void,
  opts: GetBalanceOptions = {}
): PollHandle {
  const intervalMs = Number.isFinite(POLL_INTERVAL_MS) && POLL_INTERVAL_MS > 0 ? POLL_INTERVAL_MS : 5000;
  let active = true;

  const tick = async () => {
    if (!active) return;
    try {
      const bal = await getBalance(opts);
      if (active) onUpdate(bal);
    } catch (e) {
      console.error("getBalance error:", e);
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

function getMethodSelector(): string {
  try {
    const mi = (Treasury as any).methodIdentifiers as Record<string, string> | undefined;
    const sel = mi?.["getBalance(address)"];
    if (sel) return "0x" + sel.toLowerCase();
  } catch {}
  return "0xf8b2cb4f"; // default selector for getBalance
}

function pad32(bytesHex: string): string {
  const clean = bytesHex.replace(/^0x/, "").toLowerCase();
  return clean.padStart(64, "0");
}

function encodeGetBalanceCall(solidityAddressNo0x: string): string {
  const selector = getMethodSelector().replace(/^0x/, "");
  const addr = solidityAddressNo0x.toLowerCase();
  const arg = pad32(addr);
  return "0x" + selector + arg;
}

async function getTreasuryEvmAddress(): Promise<string> {
  if (cachedTreasuryEvmAddress) return cachedTreasuryEvmAddress;
  const id = TREASURY_CONTRACT_ID.trim();
  if (id.startsWith("0x")) {
    cachedTreasuryEvmAddress = id.toLowerCase();
    return cachedTreasuryEvmAddress;
  }
  const url = `${MIRROR_NODE_URL}/api/v1/contracts/${encodeURIComponent(id)}`;
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) {
    throw new Error(`Mirror Node HTTP ${resp.status} while fetching contract evm address`);
  }
  const json = (await resp.json()) as { evm_address?: string; evm_address_hex?: string };
  const evm = (json.evm_address || json.evm_address_hex || "").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(evm)) {
    throw new Error("Could not resolve EVM address for Treasury contract");
  }
  cachedTreasuryEvmAddress = evm;
  return evm;
}

async function mirrorEthCall(params: { to: string; data: string; gas?: number }): Promise<string> {
  const payload = {
    to: params.to,
    gas: params.gas ?? 100_000,
    data: params.data,
  } as Record<string, unknown>;

  const url = `${MIRROR_NODE_URL}/api/v1/contracts/call`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Mirror contracts/call HTTP ${resp.status}: ${text}`);
  }
  const json = (await resp.json()) as { result?: string };
  return json.result ?? "0x";
}
