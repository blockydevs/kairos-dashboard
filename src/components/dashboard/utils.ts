import {getDetailedTokenDataById, solidityAddressToTokenIdString} from "@/services/dex/saucerswapApi";

interface MessageData {
  message: string;
  consensusTimestamp: string;
}

export function shortenAddress(address: string, startLength = 6, endLength = 4) {
  const addr = address.trim();
  if (addr.length <= startLength + endLength) return addr;
  const start = addr.slice(0, startLength);
  const end = addr.slice(-endLength);
  return `${start}...${end}`;
}

export async function getTokenSymbol(tokenAddress: string) {
  const tokenId = solidityAddressToTokenIdString(tokenAddress);
  const tokenData = await getDetailedTokenDataById(tokenId);
  return tokenData ? tokenData.symbol : "-";
}

export const parseMessage = (msg: MessageData) => {
  try {
    const parsed = JSON.parse(msg.message);
    return {
      consensusTimestamp: msg.consensusTimestamp,
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
