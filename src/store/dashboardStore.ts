import { create } from 'zustand'

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  setCount: (value: number) => void;
}

export const useCounterStore = create<CounterState>(set => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  setCount: (value: number) => set(() => ({ count: value })),
}));
