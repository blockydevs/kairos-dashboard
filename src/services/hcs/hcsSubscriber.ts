import { Client, PrivateKey, AccountId, TopicMessageQuery } from "@hashgraph/sdk";

export interface HcsMessage {
  consensusTimestamp: string;
  message: string;
}

export interface HcsSubscription {
  unsubscribe: () => void;
}

function createClient(mirrorNodeUrl: string): Client {
  const lower = mirrorNodeUrl.toLowerCase();
  if (lower.includes("testnet")) return Client.forTestnet();
  return Client.forMainnet();
}

export function subscribeToHcs(params: {
  mirrorNodeUrl: string;
  operatorId: string;
  operatorKey: string;
  topicId: string;
  onMessage: (msg: HcsMessage) => void;
  startTimeSeconds?: number;
}): HcsSubscription {
  const { mirrorNodeUrl, operatorId, operatorKey, topicId, onMessage, startTimeSeconds } = params;

  const client = createClient(mirrorNodeUrl);
  client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromStringECDSA(operatorKey));

  const query = new TopicMessageQuery().setTopicId(topicId);
  if (typeof startTimeSeconds === "number" && Number.isFinite(startTimeSeconds)) {
    query.setStartTime(new Date(startTimeSeconds * 1000));
  }

  const listener = query.subscribe(
    client,
    (_m, error) => {
      console.error("HCS subscribe error:", error);
    },
    (m) => {
      const decoder = new TextDecoder();
      const utf8 = decoder.decode(m.contents);
      onMessage({ consensusTimestamp: m.consensusTimestamp.toString(), message: utf8 });
    }
  );

  return {
    unsubscribe: () => listener.unsubscribe(),
  };
}
