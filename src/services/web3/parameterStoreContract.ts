import { ContractId } from "@hashgraph/sdk";
import { ethers } from "ethers";
import parameterStoreAbi from "@/services/web3/abi/ParameterStore.json";

const PARAMETERSTORE_CONTRACT_ID =
  process.env.NEXT_PUBLIC_HEDERA_PARAMETERSTORE_CONTRACT_ID?.trim() || "";
const RPC_PROVIDER_URL = process.env.NEXT_PUBLIC_RPC_PROVIDER_URL?.trim() || "";

export interface RiskParameters {
  maxTradeBps: number; // basis points
  maxSlippageBps: number; // basis points
  tradeCooldownSec: number; // seconds
}

const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER_URL);

const config = {
  contractId: PARAMETERSTORE_CONTRACT_ID,
  abi: parameterStoreAbi,
  method: "getRiskParameters",
};

export async function getRiskParameters(): Promise<RiskParameters | null> {
  try {
    const { contractId, abi, method } = config;
    if (!contractId || !RPC_PROVIDER_URL) return null;

    const address = ContractId.fromString(contractId).toSolidityAddress();
    const contract = new ethers.Contract(address, (abi as any).abi, provider);

    const out = await contract[method]();

    const maxTrade =
      typeof out?._maxTradeBps !== "undefined"
        ? out._maxTradeBps
        : Array.isArray(out)
          ? out[0]
          : undefined;
    const maxSlippage =
      typeof out?._maxSlippageBps !== "undefined"
        ? out._maxSlippageBps
        : Array.isArray(out)
          ? out[1]
          : undefined;
    const cooldown =
      typeof out?._tradeCooldownSec !== "undefined"
        ? out._tradeCooldownSec
        : Array.isArray(out)
          ? out[2]
          : undefined;

    if (
      typeof maxTrade === "undefined" ||
      typeof maxSlippage === "undefined" ||
      typeof cooldown === "undefined"
    ) {
      return null;
    }

    const toNum = (v: any): number => {
      try {
        if (typeof v === "number") return v;
        if (typeof v?.toNumber === "function") return v.toNumber();
        if (typeof v?._isBigNumber) return ethers.BigNumber.from(v).toNumber();
        return Number(v);
      } catch {
        return Number(v);
      }
    };

    return {
      maxTradeBps: toNum(maxTrade),
      maxSlippageBps: toNum(maxSlippage),
      tradeCooldownSec: toNum(cooldown),
    };
  } catch {
    return null;
  }
}
