"use client";

import { useEffect, useState } from "react";

type Subscribe<T> = (
  onData: (value: T) => void,
  onError?: (error: unknown) => void
) => () => void;

export function useFirestoreSubscription<T>(
  subscribe: Subscribe<T>,
  initialValue: T,
  enabled = true
) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    const unsubscribe = subscribe(
      (value) => {
        if (!active) return;
        setData(value);
        setLoading(false);
      },
      (subscriptionError) => {
        if (!active) return;
        setError(subscriptionError);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, subscribe]);

  return { data, loading, error };
}
