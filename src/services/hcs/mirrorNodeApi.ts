export interface MirrorNodeMessage {
  sequence_number: number;
  running_hash?: string;
  running_hash_version?: number;
  consensus_timestamp: string;
  message: string; // base64
  chunk_info?: unknown;
}

export interface DecodedMessage {
  sequenceNumber: number;
  consensusTimestamp: string;
  message: string; // decoded utf-8
}

function decodeBase64ToUtf8(b64: string): string {
  try {
    if (typeof window === "undefined") {
      return Buffer.from(b64, "base64").toString("utf-8");
    }
    const decoded = atob(b64);
    const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch {
    return b64;
  }
}

export async function fetchTopicMessages(params: {
  mirrorNodeUrl: string;
  topicId: string;
  limit?: number;
}): Promise<DecodedMessage[]> {
  const { mirrorNodeUrl, topicId, limit = 25 } = params;
  const base = mirrorNodeUrl.replace(/\/$/, "");
  const url = `${base}/api/v1/topics/${topicId}/messages?limit=${encodeURIComponent(String(limit))}&order=desc`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Mirror Node HTTP ${res.status}`);
  }
  const data = (await res.json()) as { messages: MirrorNodeMessage[] };
  return (data.messages ?? [])
    .map((m) => ({
      sequenceNumber: m.sequence_number,
      consensusTimestamp: m.consensus_timestamp,
      message: decodeBase64ToUtf8(m.message),
    }))
}
