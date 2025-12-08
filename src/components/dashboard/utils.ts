import {
  getDetailedTokenDataById,
  solidityAddressToTokenIdString,
} from "@/services/dex/saucerswapApi";

export { solidityAddressToTokenIdString };

interface MessageData {
  message: string;
  consensusTimestamp: string;
}

export function shortenAddress(
  address: string,
  startLength = 6,
  endLength = 4,
) {
  const addr = address.trim();
  if (addr.length <= startLength + endLength) return addr;
  const start = addr.slice(0, startLength);
  const end = addr.slice(-endLength);
  return `${start}...${end}`;
}

export async function getTokenDetails(tokenAddress: string) {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  if (tokenAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
    return {
      symbol: "HBAR",
      decimals: 8,
    };
  }

  const tokenId = solidityAddressToTokenIdString(tokenAddress);
  const tokenData = await getDetailedTokenDataById(tokenId);
  return {
    symbol: tokenData ? tokenData.symbol : "-",
    decimals: tokenData ? tokenData.decimals : 0,
  };
}

export const parseMessage = (msg: MessageData) => {
  try {
    const parsed = JSON.parse(msg.message);
    return {
      txHash: parsed.txHash,
      type: parsed.type,
      timestamp: parsed.timestamp ?? Number(msg.consensusTimestamp),
      initiator: parsed.initiator,
      tokenIn: parsed.tokenIn,
      tokenOut: parsed.tokenOut,
      amountIn: parsed.amountIn,
      amountOut: parsed.amountOut,
      htkReceived: parsed.htkReceived,
      amount: parsed.amount,
    };
  } catch {
    return {
      type: "Other",
      timestamp: Number(msg.consensusTimestamp),
      initiator: "-",
    };
  }
};

export const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};
