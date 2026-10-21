"use client";

import { useState, useEffect } from "react";
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
  Bug,
  Lightbulb,
  MessageSquarePlus,
  Send,
  Sun,
  Moon,
  Leaf,
  Sparkles,
  Palette,
  Check,
  AtSign,
  Edit3,
  X,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/layout/theme-provider";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const { user, logout, updateUser, refetchUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [usernameInput, setUsernameInput] = useState(user?.username || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // 60-Day Username Cooldown calculation
  const cooldownInfo = (() => {
    if (!user?.usernameChangedAt) {
      return { isLocked: false, remainingDays: 0, nextDate: null };
    }
    const lastChanged = new Date(user.usernameChangedAt).getTime();
    if (isNaN(lastChanged)) {
      return { isLocked: false, remainingDays: 0, nextDate: null };
    }
    const cooldownMs = 60 * 24 * 60 * 60 * 1000;
    const diffMs = Date.now() - lastChanged;
    if (diffMs < cooldownMs) {
      const remainingDays = Math.ceil((cooldownMs - diffMs) / (24 * 60 * 60 * 1000));
      const nextDate = new Date(lastChanged + cooldownMs).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return { isLocked: true, remainingDays, nextDate };
    }
    return { isLocked: false, remainingDays: 0, nextDate: null };
  })();

  // Real-time username check state
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available: boolean | null;
    message: string;
    isCurrent?: boolean;
  }>({ available: null, message: "" });

  useEffect(() => {
    if (user) {
      setNameInput(user.name || "");
      setUsernameInput(user.username || "");
    }
  }, [user]);

  // Debounced username availability checker
  useEffect(() => {
    if (cooldownInfo.isLocked) {
      setUsernameStatus({ available: null, message: "" });
      return;
    }

    const clean = usernameInput.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus({ available: null, message: "" });
      return;
    }

    if (user?.username && clean === user.username.toLowerCase()) {
      setUsernameStatus({ available: true, message: "Your current username", isCurrent: true });
      return;
    }

    const regex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!regex.test(clean)) {
      setUsernameStatus({
        available: false,
        message: "3-30 characters, letters, numbers, or _ only",
      });
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${clean}`);
        if (res.data?.available) {
          setUsernameStatus({ available: true, message: "Username is available!" });
        } else {
          setUsernameStatus({ available: false, message: res.data?.message || "Username is already taken" });
        }
      } catch (err: any) {
        setUsernameStatus({
          available: false,
          message: err.response?.data?.message || err.response?.data?.error || "Error checking username",
        });
      } finally {
        setCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameInput, user?.username, cooldownInfo.isLocked]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error("Display Name cannot be empty");
      return;
    }

    if (!cooldownInfo.isLocked && usernameInput.trim() && usernameStatus.available === false) {
      toast.error("Please pick an available username");
      return;
    }

    setProfileSaving(true);
    try {
      const payload: { name: string; username?: string } = {
        name: nameInput.trim(),
      };
      if (!cooldownInfo.isLocked && usernameInput.trim()) {
        payload.username = usernameInput.trim();
      }
      const res = await api.patch("/auth/profile", payload);
      if (res.data?.data) {
        updateUser(res.data.data);
      }
      toast.success("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

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

  // Issues & Suggestions state
  const [feedbackType, setFeedbackType] = useState<"BUG" | "SUGGESTION" | "FEEDBACK">("SUGGESTION");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackDesc, setFeedbackDesc] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackDesc.trim()) {
      toast.error("Please provide both a summary and details");
      return;
    }
    setFeedbackLoading(true);
    try {
      const res = await api.post("/feedback", {
        type: feedbackType,
        title: feedbackTitle.trim(),
        description: feedbackDesc.trim(),
      });
      toast.success(res.data?.message || "Thank you! Your feedback has been sent directly to the creator.");
      setFeedbackTitle("");
      setFeedbackDesc("");
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 5000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setFeedbackLoading(false);
    }
  };

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
        className="glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-500 dark:text-primary-400 flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Profile Overview</h2>
              <p className="text-xs text-muted-foreground">Your account credentials and public identity</p>
            </div>
          </div>

          {!isEditingProfile && (
            <button
              type="button"
              onClick={() => {
                setNameInput(user?.name || "");
                setUsernameInput(user?.username || "");
                setIsEditingProfile(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-semibold flex items-center gap-1.5 transition-all border border-primary-500/20 shadow-sm"
            >
              <Edit3 size={14} />
              Edit Profile & Username
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isEditingProfile ? (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveProfile}
              className="pt-2 space-y-4"
            >
              {/* Cooldown Active Banner */}
              {cooldownInfo.isLocked && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                  <Lock size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-semibold text-xs">60-Day Username Change Cooldown Active</p>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                      You recently updated your username. In accordance with MindSync security policy, usernames can only be changed once every 60 days.
                      Your next change will be available in <strong>{cooldownInfo.remainingDays} day{cooldownInfo.remainingDays === 1 ? "" : "s"} (on {cooldownInfo.nextDate})</strong>.
                      You can still update your Display Name below anytime.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User size={13} className="text-muted-foreground" />
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Your visible name across reflections, chats, and wellness reports.
                  </p>
                </div>

                {/* Unique Username Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <AtSign size={13} className="text-muted-foreground" />
                      Unique Username / Handle
                    </label>
                    {cooldownInfo.isLocked ? (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Lock size={10} /> Locked ({cooldownInfo.remainingDays}d left)
                      </span>
                    ) : checkingUsername ? (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Checking...
                      </span>
                    ) : usernameStatus.available === true ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check size={10} className="stroke-[3]" /> Available
                      </span>
                    ) : usernameStatus.available === false ? (
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        <X size={10} /> Taken
                      </span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => {
                        if (!cooldownInfo.isLocked) {
                          setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                        }
                      }}
                      disabled={cooldownInfo.isLocked}
                      readOnly={cooldownInfo.isLocked}
                      placeholder="username"
                      maxLength={30}
                      className={cn(
                        "w-full rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none transition-all",
                        cooldownInfo.isLocked
                          ? "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-muted-foreground cursor-not-allowed select-none"
                          : usernameStatus.available === true
                          ? "bg-slate-50 dark:bg-white/5 border border-emerald-500/60 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/10"
                          : usernameStatus.available === false
                          ? "bg-slate-50 dark:bg-white/5 border border-red-500/60 focus:border-red-500 focus:bg-white dark:focus:bg-white/10"
                          : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-primary-500 focus:bg-white dark:focus:bg-white/10"
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {cooldownInfo.isLocked ? (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Clock size={11} /> Unlocks on {cooldownInfo.nextDate} (60-day cooldown policy).
                      </p>
                    ) : (
                      <>
                        <p className={cn(
                          "text-[11px]",
                          usernameStatus.available === false ? "text-red-500 font-medium" : "text-muted-foreground"
                        )}>
                          {usernameStatus.message || "3-30 lowercase characters, numbers, and underscores."}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                          <Clock size={10} className="text-primary-500" /> Once claimed, username can only be changed once every 60 days.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(user?.name || "");
                    setUsernameInput(user?.username || "");
                    setIsEditingProfile(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving || (!cooldownInfo.isLocked && checkingUsername) || (!cooldownInfo.isLocked && Boolean(usernameInput.trim()) && usernameStatus.available === false)}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2"
            >
              {/* Display Name Card with Pencil Icon */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1 relative group">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Display Name</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(user?.name || "");
                      setUsernameInput(user?.username || "");
                      setIsEditingProfile(true);
                    }}
                    title="Edit Display Name"
                    className="p-1 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 transition-colors"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
              </div>

              {/* Username Card with Pencil Icon and 60-Day Status */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1.5 relative group">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Username</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(user?.name || "");
                      setUsernameInput(user?.username || "");
                      setIsEditingProfile(true);
                    }}
                    title={cooldownInfo.isLocked ? "Username locked (60-day policy)" : "Edit Username"}
                    className="p-1 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 transition-colors"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
                <p className="text-sm font-semibold text-foreground truncate font-mono">
                  {user?.username ? (
                    <span className="text-primary-600 dark:text-primary-400">@{user.username}</span>
                  ) : (
                    <span className="text-muted-foreground font-sans text-xs italic">Not claimed yet</span>
                  )}
                </p>
                <div>
                  {cooldownInfo.isLocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Clock size={10} /> Locked: {cooldownInfo.remainingDays}d left
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check size={10} /> Editable (60d rule)
                    </span>
                  )}
                </div>
              </div>

              {/* Email Address Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-sm font-semibold text-foreground truncate">{user?.email || "Unknown"}</p>
              </div>

              {/* Account Role & Streak */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                <p className="text-xs text-muted-foreground">Account Role</p>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-md",
                    user?.role === "ADMIN"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/20"
                  )}>
                    {user?.role || "USER"}
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    🔥 {user?.streak ?? 0}d
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Appearance & Color Therapy Theme Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Palette size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Theme & Visual Atmosphere</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Mood Relaxing
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Scientifically engineered palettes to reduce digital eye strain, calm autonomic stress, and enhance flow.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* 1. Relaxing Biophilic Green Dark */}
          <button
            type="button"
            onClick={() => setTheme("green")}
            className={cn(
              "p-4 rounded-xl text-left border transition-all flex flex-col justify-between relative group hover-lift-subtle",
              theme === "green"
                ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40"
                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/40"
            )}
          >
            {theme === "green" && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                <Check size={12} className="stroke-[3]" />
              </span>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Leaf size={16} />
              </div>
              <span className="font-semibold text-sm text-foreground">Forest Emerald</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#05130b] border border-emerald-500/40" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#18b368]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#8ebfa4]" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Deep biophilic moss &amp; sage tones. Scientifically proven to soothe optic nerves &amp; lower cortisol.
              </p>
            </div>
          </button>

          {/* 2. Relaxing Biophilic Emerald Light (Design 1-3 Light) */}
          <button
            type="button"
            onClick={() => setTheme("green-light")}
            className={cn(
              "p-4 rounded-xl text-left border transition-all flex flex-col justify-between relative group hover-lift-subtle",
              theme === "green-light"
                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/40"
            )}
          >
            {theme === "green-light" && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Check size={12} className="stroke-[3]" />
              </span>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center border border-emerald-500/30">
                <Sparkles size={16} />
              </div>
              <span className="font-semibold text-sm text-foreground">Emerald Glass</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#f1f8f4] border border-emerald-300" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#10b981]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#072213]" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Frosted mint glassmorphism &amp; vibrant botanical emerald. Soothing daytime light therapy aesthetic.
              </p>
            </div>
          </button>

          {/* 3. Classic Obsidian Dark */}
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "p-4 rounded-xl text-left border transition-all flex flex-col justify-between relative group hover-lift-subtle",
              theme === "dark"
                ? "bg-slate-900/60 border-primary-500 ring-2 ring-primary-500/30 shadow-lg"
                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary-500/40"
            )}
          >
            {theme === "dark" && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center">
                <Check size={12} className="stroke-[3]" />
              </span>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-200 flex items-center justify-center border border-neutral-700">
                <Moon size={16} />
              </div>
              <span className="font-semibold text-sm text-foreground">Monolithic Black</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#000000] border border-neutral-700" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#0a0a0a] border border-neutral-800" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#a3a3a3]" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Pure zero-saturation OLED true black. No bluish or violet tint for maximum contrast &amp; battery savings.
              </p>
            </div>
          </button>

          {/* 4. Daylight Pristine Light */}
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "p-4 rounded-xl text-left border transition-all flex flex-col justify-between relative group hover-lift-subtle",
              theme === "light"
                ? "bg-slate-100 border-primary-600 ring-2 ring-primary-600/30 shadow-md"
                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary-500/40"
            )}
          >
            {theme === "light" && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Check size={12} className="stroke-[3]" />
              </span>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center border border-amber-500/30">
                <Sun size={16} />
              </div>
              <span className="font-semibold text-sm text-foreground">Daylight Clean</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#0284c7]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#64748b]" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Crisp high-contrast daytime reading mode with slate boundaries and anti-glare shadows.
              </p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Change Password Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-500 dark:text-primary-400 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
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
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 transition-all"
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
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 transition-all"
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
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="Re-enter new password"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
          </button>
        </form>
      </motion.div>

      {/* Issues & Feature Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400 flex items-center justify-center">
            <MessageSquarePlus size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Report Issues & Suggestions</h2>
            <p className="text-xs text-muted-foreground">
              Send bug reports or product suggestions directly to the MindSync creator
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFeedbackType("BUG")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  feedbackType === "BUG"
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/50 shadow-sm"
                    : "bg-slate-50 dark:bg-white/5 text-muted-foreground border-slate-200 dark:border-white/10 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                }`}
              >
                <Bug size={14} /> Bug / Issue
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType("SUGGESTION")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  feedbackType === "SUGGESTION"
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/60 shadow-sm"
                    : "bg-slate-50 dark:bg-white/5 text-muted-foreground border-slate-200 dark:border-white/10 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                }`}
              >
                <Lightbulb size={14} /> Suggestion
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType("FEEDBACK")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  feedbackType === "FEEDBACK"
                    ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/50 shadow-sm"
                    : "bg-slate-50 dark:bg-white/5 text-muted-foreground border-slate-200 dark:border-white/10 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                }`}
              >
                <MessageSquarePlus size={14} /> Feedback
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title / Summary</label>
            <input
              type="text"
              value={feedbackTitle}
              onChange={(e) => setFeedbackTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder={feedbackType === "BUG" ? "e.g., Streak count reset on mobile app" : "e.g., Add dark mode OLED theme or weekly PDF summary"}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description & Details</label>
            <textarea
              rows={3}
              value={feedbackDesc}
              onChange={(e) => setFeedbackDesc(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
              placeholder={feedbackType === "BUG" ? "Describe what happened, what device you're using, and steps to reproduce..." : "Explain how this feature would help your wellness or productivity journey..."}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              Submitted from <span className="text-foreground font-semibold">{user?.email}</span>
            </span>

            <button
              type="submit"
              disabled={feedbackLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-primary-600 hover:opacity-90 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
            >
              {feedbackLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>Send to Creator</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* Danger Zone: Delete Account / Admin Protection */}
      {user?.role === "ADMIN" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/10 dark:bg-emerald-950/20 space-y-3"
        >
          <div className="flex items-center gap-3 text-emerald-500 dark:text-emerald-400">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Account Protection: Administrator</h2>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-300/70">
                Primary administrator accounts are shielded against deletion
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Your account is designated as the primary administrator of MindSync AI. Self-deletion is disabled to prevent system lockouts, protect analytics records, and maintain uninterrupted administrative control.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/25">
            <CheckCircle2 size={14} /> System Lockout Shield Active
          </div>
        </motion.div>
      ) : (
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
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card rounded-2xl p-6 border border-red-500/40 bg-card text-card-foreground shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-500 dark:text-red-400 border-b border-border pb-4">
                <AlertTriangle size={24} />
                <div>
                  <h3 className="text-base font-bold text-foreground">Confirm Account Deletion</h3>
                  <p className="text-xs text-muted-foreground">Two-step verification required</p>
                </div>
              </div>

              {deleteStep === "PASSWORD" ? (
                <form onSubmit={handleRequestDeletionCode} className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Step 1 of 2: Click below to receive a <strong>6-digit confirmation code</strong> on your registered email address (<strong>{user?.email}</strong>).
                  </p>

                  {deleteError && (
                    <p className="text-xs text-red-500 text-center font-medium">{deleteError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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

                  {process.env.NODE_ENV === "development" && deleteDevCode && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 text-center">
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
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-red-500 focus:bg-white dark:focus:bg-white/10 transition-all"
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
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground outline-none focus:border-red-500 focus:bg-white dark:focus:bg-white/10 transition-all"
                        placeholder="123456"
                        required
                      />
                    </div>
                  </div>

                  {deleteError && (
                    <p className="text-xs text-red-500 text-center font-medium">{deleteError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
