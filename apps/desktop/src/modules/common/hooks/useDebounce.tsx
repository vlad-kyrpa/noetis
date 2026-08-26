import { useEffect, useState } from "react";

interface UseDebounceParams<Value> {
  value: Value;
  delayMs: number;
}

// Delays value updates so consumers can wait for typing to settle before doing work.
export function useDebounce<Value>({
  value,
  delayMs,
}: UseDebounceParams<Value>): Value {
  const [debouncedValue, setDebouncedValue] = useState<Value>(value);

  useEffect(() => {
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delayMs, value]);

  return debouncedValue;
}
