import { NextRequest } from "next/server";
import { subscribeToHcs, type HcsMessage } from "@/services/hcs/hcsSubscriber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startTimeSecondsParam = searchParams.get("startTimeSeconds");
  const startTimeSeconds = startTimeSecondsParam
    ? Number.parseInt(startTimeSecondsParam, 10)
    : Math.floor(Date.now() / 1000);

  const operatorId = requireEnv(process.env.HEDERA_OPERATOR_ID, "HEDERA_OPERATOR_ID");
  const operatorKey = requireEnv(process.env.HEDERA_OPERATOR_KEY, "HEDERA_OPERATOR_KEY");

  const mirrorNodeUrl = requireEnv(process.env.NEXT_PUBLIC_MIRROR_NODE_URL, "NEXT_PUBLIC_MIRROR_NODE_URL");
  const topicId = requireEnv(process.env.NEXT_PUBLIC_TOPIC_ID, "NEXT_PUBLIC_TOPIC_ID");

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      const sendSse = (data: unknown) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {}
      }, 15000);

      let unsub: (() => void) | null = null;

      try {
        const sub = subscribeToHcs({
          mirrorNodeUrl,
          operatorId,
          operatorKey,
          topicId,
          startTimeSeconds: Number.isFinite(startTimeSeconds) ? startTimeSeconds : undefined,
          onMessage: (m: HcsMessage) => {
            try {
              sendSse(m);
            } catch {}
          },
        });
        unsub = sub.unsubscribe;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Subscription error";
        sendSse({ error: message });
      }

      const abort = () => {
        try {
          unsub?.();
        } catch {}
        try {
          clearInterval(heartbeat);
        } catch {}
        try {
          controller.close();
        } catch {}
      };

      req.signal?.addEventListener?.("abort", abort);
    },
    cancel() {
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
