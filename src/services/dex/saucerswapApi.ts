import {TokenId} from "@hashgraph/sdk";

const SAUCERSWAP_API_URL = process.env.NEXT_PUBLIC_SAUCERSWAP_API_URL?.trim() || "";
const SAUCERSWAP_API_KEY = process.env.NEXT_PUBLIC_SAUCERSWAP_API_KEY?.trim() || "";

export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  price: string;
  priceUsd: number;
  dueDiligenceComplete: boolean;
  isFeeOnTransferToken: boolean;
  description: string;
  website: string;
  sentinelReport: string;
  twitterHandle: string;
}

export async function getDetailedTokenDataById(tokenId: string): Promise<TokenData | undefined> {
  try {
    const headers = {'x-api-key': SAUCERSWAP_API_KEY};
    const url = `${SAUCERSWAP_API_URL}/tokens/${tokenId}`;
    const res = await fetch(url, {headers});
    return await res.json();
  } catch (e){
    console.error("Error fetching token data:", e);
  }
}

export const solidityAddressToTokenIdString = (address: string): string => {
  try {
    return TokenId.fromSolidityAddress(address).toString();
  } catch {
    return address;
  }
};