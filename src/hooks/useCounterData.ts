import {useMutation, useQuery} from "@tanstack/react-query";
import { useEffect } from "react";
import { useCounterStore } from "@/store/dashboardStore";
import { getCounter, type CounterData } from "@/services/counter";

async function fetchCounterData(): Promise<CounterData> {
  return getCounter();
}

async function updateCount(newCount: number): Promise<void> {
  // Kept for forward compatibility if an update API is added later.
  return Promise.resolve();
}

export function useCounterData() {
  const setCount = useCounterStore((state) => state.setCount);

  const query = useQuery<CounterData, Error>({
    queryKey: ["counter"],
    queryFn: fetchCounterData,
  });

  useEffect(() => {
    const value = query.data?.count;
    if (typeof value === "number" && Number.isFinite(value)) {
      setCount(value);
    }
  }, [query.data?.count, setCount]);

  const mutation = useMutation({
    mutationFn: (newCount: number) => updateCount(newCount),
  });

  const mutateCount = (newCount: number) =>
    mutation.mutate(newCount);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    mutateCount,
  };
}
