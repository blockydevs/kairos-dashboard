import { fetchTopicMessages, type DecodedMessage } from "./mirrorNodeApi";
import type { HcsMessage, HcsSubscription } from "./hcsSubscriber";

import { toast } from "sonner";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

const NEXT_PUBLIC_MIRROR_NODE_URL = process.env.NEXT_PUBLIC_MIRROR_NODE_URL;
const NEXT_PUBLIC_TOPIC_ID = process.env.NEXT_PUBLIC_TOPIC_ID;

export type { DecodedMessage };

export async function fetchInitialMessages(
  limit = 25,
): Promise<DecodedMessage[]> {
  const mirrorNodeUrl = requireEnv(
    NEXT_PUBLIC_MIRROR_NODE_URL,
    "NEXT_PUBLIC_MIRROR_NODE_URL",
  );
  const topicId = requireEnv(NEXT_PUBLIC_TOPIC_ID, "NEXT_PUBLIC_TOPIC_ID");
  return fetchTopicMessages({ mirrorNodeUrl, topicId, limit });
}

export function subscribeToNewMessages(
  onMessage: (m: DecodedMessage) => void,
): HcsSubscription {
  const startTimeSeconds = Math.floor(Date.now() / 1000);
  const url = `/api/hcs/stream?startTimeSeconds=${encodeURIComponent(startTimeSeconds)}`;
  const es = new EventSource(url);

  es.onmessage = (evt) => {
    try {
      const raw = JSON.parse(evt.data);
      if (raw.error) {
        toast.error(`Mirror Node error: ${raw.error}`, {
          id: "mirror-node-sse-error",
        });
        return;
      }

      const decoded: DecodedMessage = {
        message: raw.message,
        consensusTimestamp: raw.consensusTimestamp,
        sequenceNumber: raw.sequenceNumber,
      };
      onMessage(decoded);
    } catch (e) {
      console.error("Error parsing SSE message:", e);
    }
  };

  es.onerror = () => {
    console.error("SSE connection error");
    toast.error("Mirror Node connection error", {
      id: "mirror-node-sse-error",
    });
  };

  return {
    unsubscribe: () => es.close(),
  };
}
