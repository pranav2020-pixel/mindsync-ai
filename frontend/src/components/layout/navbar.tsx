"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Notification } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";
import {
  Sun, Moon, Bell, LogOut, User, Settings, Check, Trash2,
  Shield, FileText, Sparkles, Inbox, Menu, X
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Automatically close dropdowns whenever user switches to a different section
  useEffect(() => {
    setShowNotifications(false);
    setShowProfile(false);
  }, [pathname]);

  // Click outside, escape key, and mobile sidebar trigger handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfile(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowProfile(false);
      }
    };

    const handleDrawerOpen = () => {
      setShowNotifications(false);
      setShowProfile(false);
    };

    if (showNotifications || showProfile) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-mobile-sidebar", handleDrawerOpen);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-mobile-sidebar", handleDrawerOpen);
    };
  }, [showNotifications, showProfile]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data?.data) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      // Silently fail if not authenticated or error
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      // Ignore
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete("/notifications/clear");
      setNotifications([]);
    } catch (err) {
      // Ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 w-full glass border-b border-white/10 pt-[env(safe-area-inset-top,0px)]">
      <div className="h-16 flex items-center justify-between px-3.5 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("open-mobile-sidebar"));
            }
          }}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="flex lg:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
            <img src="/logo.png" alt="MindSync AI" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-base text-gradient tracking-tight">MindSync</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Popover */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors relative text-muted-foreground hover:text-white"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-primary-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="fixed sm:absolute top-[calc(4.25rem+env(safe-area-inset-top,0px))] sm:top-12 left-3 right-3 sm:left-auto sm:right-0 sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0 glass-card rounded-2xl p-4 shadow-2xl border border-slate-200/80 dark:border-white/10 z-50"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-primary-500/20 text-primary-700 dark:text-primary-300 font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {notifications.length > 0 && (
                      <>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="hover:text-primary-500 p-1 rounded-md transition-colors"
                            title="Mark all as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={handleClearAll}
                          className="hover:text-red-500 p-1 rounded-md transition-colors"
                          title="Clear all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="hover:text-slate-900 dark:hover:text-white p-1 rounded-md transition-colors"
                      title="Close"
                      aria-label="Close notifications"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Inbox size={32} className="mx-auto mb-2 opacity-40 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
                      <p className="text-xs font-semibold text-slate-800 dark:text-foreground/90">No notifications</p>
                      <p className="text-[11px] text-slate-500 dark:text-muted-foreground mt-0.5">
                        Recent password updates and report downloads will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "p-3 rounded-xl border transition-colors",
                          n.isRead
                            ? "bg-slate-100/70 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/5 text-slate-600 dark:text-muted-foreground"
                            : "bg-primary-50/80 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20 text-slate-900 dark:text-foreground"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 text-primary-500 dark:text-primary-400 shrink-0">
                            {n.title.toLowerCase().includes("password") ? (
                              <Shield size={16} />
                            ) : n.title.toLowerCase().includes("report") ? (
                              <FileText size={16} />
                            ) : (
                              <Sparkles size={16} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold truncate text-slate-900 dark:text-foreground">
                                {n.title}
                              </p>
                              <span className="text-[10px] text-slate-500 dark:text-muted-foreground shrink-0">
                                {new Date(n.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-muted-foreground mt-1 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-wellness-focus flex items-center justify-center text-sm font-bold text-white shadow-md">
              {user?.name?.[0] || "U"}
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-12 w-56 glass-card rounded-xl p-2 shadow-2xl z-50 border border-slate-200/80 dark:border-white/10"
              >
                <div className="px-3 py-2 border-b border-slate-200/80 dark:border-white/10 mb-1">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowProfile(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Settings size={16} /> Account Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-wellness-stress hover:bg-wellness-stress/10 rounded-lg transition-colors"
                >
                  <LogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </header>
  );
}
