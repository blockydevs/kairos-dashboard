import {
  Client,
  PrivateKey,
  AccountId,
  TopicMessageSubmitTransaction,
  TopicId,
} from "@hashgraph/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function createClient(mirrorNodeUrl: string): Client {
  const lower = mirrorNodeUrl.toLowerCase();
  if (lower.includes("testnet")) return Client.forTestnet();
  return Client.forMainnet();
}

function randomAddress() {
  const collection = [
    "0x0000000000000000000000000000000000003ad2",
    "0x0000000000000000000000000000000000001549",
  ];
  return collection[Math.floor(Math.random() * collection.length)];
}

export async function GET() {
  try {
    const operatorId = requireEnv(
      process.env.HEDERA_OPERATOR_ID,
      "HEDERA_OPERATOR_ID",
    );
    const operatorKey = requireEnv(
      process.env.HEDERA_OPERATOR_KEY,
      "HEDERA_OPERATOR_KEY",
    );
    const topicIdStr = requireEnv(
      process.env.NEXT_PUBLIC_TOPIC_ID,
      "NEXT_PUBLIC_TOPIC_ID",
    );
    const mirrorNodeUrl = requireEnv(
      process.env.NEXT_PUBLIC_MIRROR_NODE_URL,
      "NEXT_PUBLIC_MIRROR_NODE_URL",
    );

    const client = createClient(mirrorNodeUrl).setOperator(
      AccountId.fromString(operatorId),
      PrivateKey.fromStringECDSA(operatorKey),
    );

    const topicId = TopicId.fromString(topicIdStr);

    const types = ["BuybackExecuted", "SwapExecuted", "Burned"] as const;
    const type = types[Math.floor(Math.random() * types.length)];

    let eventPayload: Record<string, any> = {
      type,
      timestamp: Math.floor(Date.now() / 1000),
    };

    if (type === "BuybackExecuted") {
      eventPayload = {
        ...eventPayload,
        tokenIn: randomAddress(),
        amountIn: Math.floor(Math.random() * 1000),
        htkReceived: Math.floor(Math.random() * 500),
        initiator: randomAddress(),
      };
    } else if (type === "SwapExecuted") {
      eventPayload = {
        ...eventPayload,
        tokenIn: randomAddress(),
        tokenOut: randomAddress(),
        amountIn: Math.floor(Math.random() * 1000),
        amountOut: Math.floor(Math.random() * 1000),
        initiator: randomAddress(),
      };
    } else if (type === "Burned") {
      eventPayload = {
        ...eventPayload,
        amount: Math.floor(Math.random() * 1000),
        initiator: randomAddress(),
      };
    }

    const eventMessage = JSON.stringify(eventPayload);

    await new TopicMessageSubmitTransaction({
      topicId,
      message: eventMessage,
    }).execute(client);

    return Response.json({
      ok: true,
      topicId: topicId.toString(),
      event: eventPayload,
    });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to submit HCS message";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
