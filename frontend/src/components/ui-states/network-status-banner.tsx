"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Wifi, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Network Information API check for slow 2G/3G connections
    const nav = navigator as any;
    if (nav.connection) {
      const checkConnectionSpeed = () => {
        const effectiveType = nav.connection.effectiveType;
        const rtt = nav.connection.rtt;
        if (effectiveType === "slow-2g" || effectiveType === "2g" || (rtt && rtt > 1500)) {
          setIsSlow(true);
        } else {
          setIsSlow(false);
        }
      };
      checkConnectionSpeed();
      nav.connection.addEventListener("change", checkConnectionSpeed);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        nav.connection.removeEventListener("change", checkConnectionSpeed);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center">
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="w-full bg-rose-600 text-white shadow-md pointer-events-auto px-4 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] pb-2.5 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium"
          >
            <WifiOff size={16} className="animate-pulse shrink-0" />
            <span>You are currently offline. MindSync features are running on local cache.</span>
            <button
              onClick={() => window.location.reload()}
              className="ml-2 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[11px] font-semibold uppercase tracking-wider transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnected Banner */}
      <AnimatePresence>
        {isOnline && showReconnected && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="w-full bg-emerald-600 text-white shadow-md pointer-events-auto px-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
          >
            <Wifi size={16} className="shrink-0" />
            <span>Connection restored. Back online!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slow Network Warning */}
      <AnimatePresence>
        {isOnline && isSlow && !showReconnected && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="w-full bg-amber-600 text-white shadow-sm pointer-events-auto px-4 pt-[calc(0.375rem+env(safe-area-inset-top,0px))] pb-1.5 flex items-center justify-center gap-2 text-xs font-medium"
          >
            <AlertTriangle size={14} className="shrink-0" />
            <span>Slow connection detected. Cloud AI responses and charts may take longer to load.</span>
            <button
              onClick={() => setIsSlow(false)}
              className="ml-2 text-xs opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
