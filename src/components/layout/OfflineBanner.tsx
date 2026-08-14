"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";


export function OfflineBanner() {
  const { isOffline, isReconnected } = useNetworkStatus();

  const showBanner = isOffline || isReconnected;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key={isOffline ? "offline" : "reconnected"}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden w-full z-50"
          role="status"
          aria-live="polite"
        >
          <div
            className={`
              flex items-center justify-center gap-2.5
              px-4 py-2.5
              text-xs font-mono font-bold tracking-wide
              ${
                isOffline
                  ? "bg-amber-500/90 text-amber-950 dark:bg-amber-600/90 dark:text-amber-50"
                  : "bg-emerald-500/90 text-emerald-950 dark:bg-emerald-600/90 dark:text-emerald-50"
              }
            `}
          >
            {isOffline ? (
              <>
                <WifiOff size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>Mode Hors-ligne · Données locales</span>
              </>
            ) : (
              <>
                <Wifi size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>Connexion rétablie</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
