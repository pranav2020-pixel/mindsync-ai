"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Notification } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Bell, LogOut, User, Settings, Check, Trash2, Shield, FileText, Sparkles, Inbox, Menu } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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
    <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-3.5 sm:px-6 sticky top-0 z-30">
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
        <div className="relative">
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
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-96 max-w-sm glass-card rounded-2xl p-4 shadow-2xl border border-white/10 z-50"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-primary-500/20 text-primary-300 font-medium px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="hover:text-primary-400 p-1 transition-colors"
                          title="Mark all as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={handleClearAll}
                        className="hover:text-red-400 p-1 transition-colors"
                        title="Clear all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Inbox size={32} className="mx-auto mb-2 opacity-40 stroke-[1.5]" />
                      <p className="text-xs font-medium text-foreground/80">No notifications</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Recent password updates and report downloads will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border transition-colors ${
                          n.isRead
                            ? "bg-white/[0.02] border-white/5 text-muted-foreground"
                            : "bg-primary-500/10 border-primary-500/20 text-foreground"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 text-primary-400 shrink-0">
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
                              <p className="text-xs font-semibold truncate text-foreground">
                                {n.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {new Date(n.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
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
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-wellness-focus flex items-center justify-center text-sm font-bold">
              {user?.name?.[0] || "U"}
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 w-56 glass-card rounded-xl p-2 shadow-2xl z-50 border border-white/10"
              >
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowProfile(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors"
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
    </header>
  );
}
