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

export async function GET() {
  try {
    const operatorId = requireEnv(process.env.HEDERA_OPERATOR_ID, "HEDERA_OPERATOR_ID");
    const operatorKey = requireEnv(process.env.HEDERA_OPERATOR_KEY, "HEDERA_OPERATOR_KEY");
    const topicIdStr = requireEnv(process.env.NEXT_PUBLIC_TOPIC_ID, "NEXT_PUBLIC_TOPIC_ID");
    const mirrorNodeUrl = requireEnv(process.env.NEXT_PUBLIC_MIRROR_NODE_URL,"NEXT_PUBLIC_MIRROR_NODE_URL");

    const client = createClient(mirrorNodeUrl).setOperator(
      AccountId.fromString(operatorId),
      PrivateKey.fromStringECDSA(operatorKey)
    );

    const topicId = TopicId.fromString(topicIdStr);
    const randomMsg = `Hello Hedera ${Math.random()}`;

    await new TopicMessageSubmitTransaction({
      topicId,
      message: randomMsg,
    }).execute(client);

    return Response.json({ ok: true, topicId: topicId.toString(), message: randomMsg });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to submit HCS message";
    return Response.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
