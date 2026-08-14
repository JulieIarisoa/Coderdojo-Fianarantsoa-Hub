"use client";

import { useState, useEffect, useCallback } from "react";

interface NetworkStatus {
  /** True when the browser detects no network connection */
  isOffline: boolean;
  /** True for a brief period after reconnecting (used for the "back online" banner) */
  isReconnected: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator !== "undefined") {
      return !navigator.onLine;
    }
    return false;
  });
  const [isReconnected, setIsReconnected] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOffline(false);
    setIsReconnected(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
    setIsReconnected(false);
  }, []);

  // Auto-dismiss the "reconnected" banner after 3 seconds
  useEffect(() => {
    if (!isReconnected) return;

    const timer = setTimeout(() => {
      setIsReconnected(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isReconnected]);

  useEffect(() => {
    // Listen for browser online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for Service Worker connectivity messages
    function handleSWMessage(event: MessageEvent) {
      if (event.data?.type === "SW_OFFLINE") {
        handleOffline();
      } else if (event.data?.type === "SW_ONLINE") {
        handleOnline();
      }
    }

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, [handleOnline, handleOffline]);

  return { isOffline, isReconnected };
}
