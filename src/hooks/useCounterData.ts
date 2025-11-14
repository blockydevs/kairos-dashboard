import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import { useEffect } from "react";
import { useCounterStore } from "@/store/dashboardStore";

const STORAGE_KEY = "counter.count";

async function fetchCounterData(): Promise<{ count: number }> {
  return new Promise((resolve) =>
    setTimeout(() => {
      // SSR guard: localStorage is only available in the browser
      if (typeof window === "undefined") {
        resolve({ count: 5 });
        return;
      }

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        let count: number;
        if (raw === null) {
          // Initialize with default if not present
          count = 5;
          window.localStorage.setItem(STORAGE_KEY, String(count));
        } else {
          count = Number(raw);
        }
        resolve({ count });
      } catch {
        // Fallback on any error
        resolve({ count: -1 });
      }
    }, 300)
  );
}

async function updateCount(newCount: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, String(newCount));
        } catch {
          console.error(`localStorage error: ${newCount}`)
        }
      }
      resolve();
    }, 200);
  });
}

export function useCounterData() {
  const queryClient = useQueryClient();
  const setCount = useCounterStore((state) => state.setCount);

  const query = useQuery<{ count: number }, Error>({
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
    mutation.mutate(newCount, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["counter"] });
      },
    });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    mutateCount,
  };
}
