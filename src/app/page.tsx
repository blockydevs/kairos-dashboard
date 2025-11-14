"use client";

import ReactQueryProvider from "../providers/ReactQueryProvider";
import { useCounterStore } from "@/store/dashboardStore";
import { useCounterData } from "@/hooks/useCounterData";

function CounterComponent() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);

  const { data, isLoading, error, mutateCount } = useCounterData();

  const handleIncrementAndSave = () => {
    const base = data?.count ?? count;
    increment();
    mutateCount(base + 1);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black space-y-4">
      <h1 className="text-4xl font-bold">Count: {count}</h1>

      <div className="space-x-4">
        <button
          onClick={handleIncrementAndSave}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Increment and Save
        </button>
        <button
          onClick={decrement}
          className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Decrement
        </button>
      </div>

      <div>
        {isLoading && <p>Loading data...</p>}
        {error && <p>Error loading data</p>}
        {data && <p>Data from server: {JSON.stringify(data)}</p>}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ReactQueryProvider>
      <CounterComponent />
    </ReactQueryProvider>
  );
}
