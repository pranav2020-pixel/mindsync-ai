"use client";

import { useState, useEffect } from "react";
import { Download, X, Share2, PlusSquare, Smartphone, Monitor, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.warn("[PWA] Service Worker registration failed:", error);
        });
    }

    // 2. Check if already running in standalone mode (installed app)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return; // Already installed and open in PWA mode
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|android/.test(userAgent);

    if (isAppleDevice) {
      setIsIOS(true);
    }

    // 4. Check if user dismissed banner recently
    const dismissedUntil = localStorage.getItem("mindsync_pwa_dismissed");
    const isDismissed = dismissedUntil && new Date().getTime() < parseInt(dismissedUntil, 10);

    // 5. Android / Chrome / Edge install prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // If iOS and not dismissed, show install prompt after 3 seconds
    if (isAppleDevice && !isStandaloneMode && !isDismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Custom trigger from sidebar or navbar
    const handleTriggerInstall = () => {
      if (isAppleDevice) {
        setShowIOSModal(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === "accepted") {
            setInstalled(true);
            setShowBanner(false);
          }
        });
      } else {
        // Fallback instructions
        setShowIOSModal(true);
      }
    };

    window.addEventListener("trigger-pwa-install", handleTriggerInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-pwa-install", handleTriggerInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 2 days
    const twoDays = new Date().getTime() + 2 * 24 * 60 * 60 * 1000;
    localStorage.setItem("mindsync_pwa_dismissed", twoDays.toString());
  };

  if (isStandalone || installed) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto"
          >
            <div className="glass-card bg-slate-900/95 backdrop-blur-xl border border-primary-500/30 p-4 rounded-2xl shadow-2xl shadow-primary-500/10 flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-md shadow-primary-500/20">
                  <img src="/logo.png" alt="MindSync AI" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5 truncate">
                    Install MindSync AI
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-400 font-medium border border-primary-500/30">
                      App
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    Fast access on your home screen
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="px-3.5 py-2 bg-gradient-to-r from-primary-500 to-wellness-focus hover:from-primary-600 hover:to-wellness-focus/90 text-white rounded-xl text-xs font-semibold shadow-md shadow-primary-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Download size={14} />
                  <span>Install</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS & Desktop Install Instructions Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card bg-slate-900 border border-white/15 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg shadow-primary-500/25 mb-4">
                  <img src="/logo.png" alt="MindSync AI" className="w-full h-full object-cover" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  Install MindSync AI
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  {isIOS
                    ? "Add MindSync to your iPhone or iPad home screen for full app experience"
                    : "Install MindSync on your device for instant launch and offline access"}
                </p>

                {isIOS ? (
                  <div className="w-full space-y-3.5 text-left text-xs">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Tap Share in Safari</p>
                        <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                          Tap the <Share2 size={13} className="text-primary-400 inline" /> Share icon at the bottom of the screen.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Add to Home Screen</p>
                        <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                          Scroll down and tap <PlusSquare size={13} className="text-primary-400 inline" /> <strong>Add to Home Screen</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Tap &apos;Add&apos;</p>
                        <p className="text-muted-foreground mt-0.5">
                          Confirm by tapping <strong>Add</strong> in the top-right corner.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-3 text-left text-xs">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <Monitor size={18} className="text-primary-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Desktop (Chrome / Edge)</p>
                        <p className="text-muted-foreground mt-0.5">
                          Click the <strong>Install</strong> icon in the address bar (next to the bookmark star), or open the browser menu &gt; <strong>Install MindSync AI</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <Smartphone size={18} className="text-primary-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Android</p>
                        <p className="text-muted-foreground mt-0.5">
                          Tap the three dots (⋮) in Chrome and select <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-full mt-6 py-2.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 font-medium rounded-xl text-xs border border-primary-500/30 transition-colors"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}