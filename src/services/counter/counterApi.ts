export interface CounterData {
  count: number;
}

const PRIMARY_ENDPOINT = process.env.NEXT_PUBLIC_PRIMARY_ENDPOINT!;

export async function fetchFromPrimary(): Promise<CounterData> {
  const res = await fetch(PRIMARY_ENDPOINT, {
    cache: "no-store",
    headers: {
      Accept: "text/plain, */*",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const text = await res.text();
  const parsed = Number(text.trim());

  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid response format: expected numeric text");
  }

  return { count: parsed };
}
