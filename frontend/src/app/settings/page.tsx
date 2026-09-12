"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  KeyRound,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"PASSWORD" | "CODE">("PASSWORD");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteDevCode, setDeleteDevCode] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success(res.data.message || "Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRequestDeletionCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await api.post("/auth/delete-account/request");
      if (res.data.devCode) {
        setDeleteDevCode(res.data.devCode);
      }
      toast.success("Confirmation code sent to your email!");
      setDeleteStep("CODE");
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || "Failed to send confirmation code.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await api.post("/auth/delete-account/confirm", {
        password: deletePassword,
        code: deleteCode.trim(),
      });
      toast.success(res.data.message || "Account permanently deleted.");
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || "Failed to delete account. Please verify credentials.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account & Security Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account profile, credentials, and data privacy options.
        </p>
      </div>

      {/* Profile Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-white/10 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Profile Overview</h2>
            <p className="text-xs text-muted-foreground">Your account credentials and status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="text-sm font-medium">{user?.name || "User"}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <p className="text-xs text-muted-foreground">Email Address</p>
            <p className="text-sm font-medium">{user?.email || "Unknown"}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <p className="text-xs text-muted-foreground">Account Role</p>
            <p className="text-sm font-medium">{user?.role || "USER"}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <p className="text-xs text-muted-foreground">Active Streak</p>
            <p className="text-sm font-medium text-amber-400">{user?.streak ?? 0} days</p>
          </div>
        </div>
      </motion.div>

      {/* Change Password Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6 border border-white/10 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Change Password</h2>
            <p className="text-xs text-muted-foreground">Update your password to keep your account safe</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500"
                placeholder="Re-enter new password"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
          </button>
        </form>
      </motion.div>

      {/* Danger Zone: Delete Account */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-6 border border-red-500/30 bg-red-950/10 space-y-4"
      >
        <div className="flex items-center gap-3 text-red-400">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Danger Zone: Delete Account</h2>
            <p className="text-xs text-red-300/70">
              Permanently delete your account and all wellness records with email confirmation
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Deleting your account is completely irreversible. Once verified with your password and email
          confirmation code, all your journal reflections, mood tracks, habit records, AI insights, and session data
          will be wiped permanently from our database.
        </p>

        <button
          onClick={() => {
            setIsDeleteModalOpen(true);
            setDeleteStep("PASSWORD");
            setDeleteError("");
            setDeletePassword("");
            setDeleteCode("");
          }}
          className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Trash2 size={16} /> Request Account Deletion
        </button>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card rounded-2xl p-6 border border-red-500/40 bg-slate-900 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-400 border-b border-white/10 pb-4">
                <AlertTriangle size={24} />
                <div>
                  <h3 className="text-base font-bold">Confirm Account Deletion</h3>
                  <p className="text-xs text-muted-foreground">Two-step verification required</p>
                </div>
              </div>

              {deleteStep === "PASSWORD" ? (
                <form onSubmit={handleRequestDeletionCode} className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Step 1 of 2: Click below to receive a <strong>6-digit confirmation code</strong> on your registered email address (<strong>{user?.email}</strong>).
                  </p>

                  {deleteError && (
                    <p className="text-xs text-red-400 text-center">{deleteError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={deleteLoading}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors flex items-center gap-2"
                    >
                      {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : "Send Email Code"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmDeletion} className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Step 2 of 2: Enter your current password and the <strong>6-digit code</strong> sent to <strong>{user?.email}</strong> to permanently purge your account.
                  </p>

                  {deleteDevCode && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 text-center">
                      <strong>Test Code:</strong> <span className="font-mono text-sm tracking-widest">{deleteDevCode}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-red-500"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">6-Digit Email Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input
                        type="text"
                        maxLength={6}
                        value={deleteCode}
                        onChange={(e) => setDeleteCode(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest outline-none focus:border-red-500"
                        placeholder="123456"
                        required
                      />
                    </div>
                  </div>

                  {deleteError && (
                    <p className="text-xs text-red-400 text-center">{deleteError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={deleteLoading}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors flex items-center gap-2"
                    >
                      {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : "Permanently Delete Account"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
