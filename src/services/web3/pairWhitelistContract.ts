import { ContractId } from "@hashgraph/sdk";
import { ethers } from "ethers";
import pairWhitelistAbi from "@/services/web3/abi/PairWhitelist.json";

const PAIRWHITELIST_CONTRACT_ID = process.env.NEXT_PUBLIC_HEDERA_PAIRWHITELIST_CONTRACT_ID?.trim() || "";
const RPC_PROVIDER_URL = process.env.NEXT_PUBLIC_RPC_PROVIDER_URL?.trim() || "";

export interface WhitelistedPair {
  tokenIn: string;
  tokenOut: string;
}

const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER_URL);

const config = {
  contractId: PAIRWHITELIST_CONTRACT_ID,
  abi: pairWhitelistAbi,
  method: "getAllWhitelistedPairs"
};

export async function getPairWhitelist(): Promise<WhitelistedPair[]> {
  try {
    const { contractId, abi, method = "getAllWhitelistedPairs" } = config;

    const address = ContractId.fromString(contractId).toSolidityAddress();
    const contract = new ethers.Contract(address, abi.abi, provider);

    const out = await contract[method]();
    if (!Array.isArray(out)) return [];

    const pairs: WhitelistedPair[] = [];

    for (const item of out) {
      const tokenIn =
        typeof item?.tokenIn === "string"
          ? item.tokenIn
          : Array.isArray(item)
            ? item[0]
            : undefined;

      const tokenOut =
        typeof item?.tokenOut === "string"
          ? item.tokenOut
          : Array.isArray(item)
            ? item[1]
            : undefined;

      if (typeof tokenIn === "string" && typeof tokenOut === "string") {
        pairs.push({
          tokenIn: tokenIn.toLowerCase(),
          tokenOut: tokenOut.toLowerCase(),
        });
      }
    }

    return pairs;
  } catch {
    return [];
  }
}
