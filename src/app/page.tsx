"use client"

import {useCounterStore} from "@/store/dashboardStore";

export default function Home() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black space-y-4">
      <h1 className="text-4xl font-bold">{count}</h1>
      <div className="space-x-4">
        <button
          onClick={increment}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Increment
        </button>
        <button
          onClick={decrement}
          className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
