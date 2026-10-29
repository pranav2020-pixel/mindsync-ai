"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
  ShieldCheck,
  FileText,
  ExternalLink,
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
  Camera,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image as ImageIcon,
  Eye,
  Maximize2,
  Download,
  HelpCircle,
  PlayCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/layout/theme-provider";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import {
  playJournalSaveShimmer,
  playSoftDeleteSweep,
  isSoundMuted,
  toggleSoundMuted,
  SOUND_MUTE_CHANGE_EVENT,
  playNavTap,
  playCelebrationChord,
} from "@/lib/sound-effects";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const { user, logout, updateUser, refetchUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [usernameInput, setUsernameInput] = useState(user?.username || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Sound preferences state
  const [soundMuted, setSoundMuted] = useState(false);

  useEffect(() => {
    setSoundMuted(isSoundMuted());
    const handleMuteChange = () => {
      setSoundMuted(isSoundMuted());
    };
    window.addEventListener(SOUND_MUTE_CHANGE_EVENT, handleMuteChange);
    return () => window.removeEventListener(SOUND_MUTE_CHANGE_EVENT, handleMuteChange);
  }, []);

  const handleToggleSound = () => {
    const next = toggleSoundMuted();
    setSoundMuted(next);
    if (!next) {
      playCelebrationChord();
      toast.success("Procedural sound effects enabled!");
    } else {
      toast("Sound effects muted", { icon: "🔇" });
    }
  };

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

  // Automatically fetch latest user profile on mount to guarantee fresh cooldown state
  useEffect(() => {
    refetchUser();
  }, []);

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
      playJournalSaveShimmer();
      toast.success("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // Instagram-Style Profile Picture Avatar Crop State
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isViewingAvatar, setIsViewingAvatar] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, or WebP)");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      toast.error("Image file is too large (max 12MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      imageObjRef.current = null;
      setSelectedImageSrc(reader.result as string);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      setAvatarModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedImageSrc) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageObjRef.current;
    if (!img) {
      const newImg = new Image();
      newImg.crossOrigin = "anonymous";
      newImg.onload = () => {
        imageObjRef.current = newImg;
        drawCanvas();
      };
      newImg.src = selectedImageSrc;
      return;
    }

    const size = canvas.width; // 280
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    // Dark viewport background
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, size, size);

    const imgAspect = img.width / img.height;
    let baseW = size;
    let baseH = size;
    if (imgAspect > 1) {
      baseH = size;
      baseW = size * imgAspect;
    } else {
      baseW = size;
      baseH = size / imgAspect;
    }

    const w = baseW * zoomScale;
    const h = baseH * zoomScale;
    const x = (size - w) / 2 + panOffset.x;
    const y = (size - h) / 2 + panOffset.y;

    // Draw user image
    ctx.drawImage(img, x, y, w, h);

    // Instagram circular mask: fill outside the circle with dark translucent frosted mask
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fill();

    // Circular white border guide
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grid center crosshair lines
    const radius = size / 2 - 6;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2 - radius);
    ctx.lineTo(size / 2, size / 2 + radius);
    ctx.moveTo(size / 2 - radius, size / 2);
    ctx.lineTo(size / 2 + radius, size / 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4 precision optical quadrant ticks
    const tickLen = 6;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2 - radius - 2);
    ctx.lineTo(size / 2, size / 2 - radius + tickLen);
    ctx.moveTo(size / 2, size / 2 + radius + 2);
    ctx.lineTo(size / 2, size / 2 + radius - tickLen);
    ctx.moveTo(size / 2 - radius - 2, size / 2);
    ctx.lineTo(size / 2 - radius + tickLen, size / 2);
    ctx.moveTo(size / 2 + radius + 2, size / 2);
    ctx.lineTo(size / 2 + radius - tickLen, size / 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }, [selectedImageSrc, zoomScale, panOffset]);

  useEffect(() => {
    if (avatarModalOpen) {
      drawCanvas();
    }
  }, [avatarModalOpen, drawCanvas]);

  // Global Escape key dismiss handler for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isViewingAvatar) setIsViewingAvatar(false);
        if (avatarModalOpen) setAvatarModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isViewingAvatar, avatarModalOpen]);

  const touchDistanceRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDragging) {
      setPanOffset({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (currentDist - touchDistanceRef.current) * 0.006;
      setZoomScale((prev) => Math.min(3.0, Math.max(0.8, parseFloat((prev + delta).toFixed(2)))));
      touchDistanceRef.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoomScale((prev) => Math.min(3.0, Math.max(0.8, parseFloat((prev + delta).toFixed(2)))));
  };

  const handleSaveAvatar = async () => {
    const img = imageObjRef.current;
    if (!img) return;

    setAvatarSaving(true);
    try {
      const exportSize = 400;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context");

      const previewSize = 280;
      const scaleToExport = exportSize / previewSize;

      const imgAspect = img.width / img.height;
      let baseW = previewSize;
      let baseH = previewSize;
      if (imgAspect > 1) {
        baseH = previewSize;
        baseW = previewSize * imgAspect;
      } else {
        baseW = previewSize;
        baseH = previewSize / imgAspect;
      }

      const w = baseW * zoomScale * scaleToExport;
      const h = baseH * zoomScale * scaleToExport;
      const x = ((previewSize - baseW * zoomScale) / 2 + panOffset.x) * scaleToExport;
      const y = ((previewSize - baseH * zoomScale) / 2 + panOffset.y) * scaleToExport;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportSize, exportSize);
      ctx.drawImage(img, x, y, w, h);

      const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.88);

      const res = await api.patch("/auth/profile", { avatar: dataUrl });
      if (res.data?.data) {
        updateUser(res.data.data);
      }
      playJournalSaveShimmer();
      toast.success("Profile picture updated successfully!");
      setAvatarModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to update profile photo");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    setAvatarSaving(true);
    try {
      const res = await api.patch("/auth/profile", { avatar: null });
      if (res.data?.data) {
        updateUser(res.data.data);
      }
      playSoftDeleteSweep();
      toast.success("Profile photo removed");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove photo");
    } finally {
      setAvatarSaving(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account &amp; Security Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your account profile, credentials, and data privacy options.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("mindsync:start-tour"));
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-semibold flex items-center gap-1.5 border border-primary-500/20 transition-all shadow-sm active:scale-95"
          >
            <PlayCircle size={14} />
            Replay Tour
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("mindsync:open-help"));
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 border border-border/70 transition-all shadow-sm active:scale-95"
          >
            <HelpCircle size={14} />
            Help &amp; Support
          </button>
        </div>
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

        {/* Hidden File Input for Profile Photo */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
        />

        {/* Instagram Profile Picture Presentation */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5">
          {/* Avatar with Instagram Gradient Ring */}
          <div className="relative group shrink-0">
            <div className="avatar-circle p-[3px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md">
              <div
                onClick={() => {
                  if (user?.avatar) {
                    setIsViewingAvatar(true);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className="avatar-circle w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-900 relative cursor-pointer flex items-center justify-center transition-all group-hover:brightness-95"
                title={user?.avatar ? "Click to view full photo" : "Click to upload profile picture"}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400 select-none">
                    {user?.name?.[0] || "U"}
                  </span>
                )}
                <div className="avatar-circle absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1">
                  {user?.avatar ? (
                    <>
                      <Eye size={18} />
                      <span>View</span>
                    </>
                  ) : (
                    <>
                      <Camera size={18} />
                      <span>Upload</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Camera badge trigger (always triggers file upload) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="avatar-circle absolute bottom-0 right-0 p-2 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-md border-2 border-white dark:border-slate-900 transition-transform active:scale-95 hover:scale-105"
              title="Change profile photo"
            >
              <Camera size={13} />
            </button>
          </div>

          {/* Profile details & photo action buttons */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base font-bold text-foreground">{user?.name || "User"}</h3>
                {user?.username && (
                  <span className="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
                    @{user.username}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {user?.avatar && (
                <button
                  type="button"
                  onClick={() => setIsViewingAvatar(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-white/10 shadow-sm"
                >
                  <Eye size={13} />
                  View Photo
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-semibold flex items-center gap-1.5 transition-all border border-primary-500/20 shadow-sm"
              >
                <Camera size={13} />
                Change Photo
              </button>

              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarSaving}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 border border-red-500/20"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              )}
            </div>
          </div>
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
              Calming themes designed to reduce eye strain, ease stress, and keep you comfortable.
            </p>
          </div>
        </div>

        <div role="radiogroup" aria-label="Theme & Visual Atmosphere" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {/* 1. Relaxing Biophilic Green Dark */}
          <button
            type="button"
            role="radio"
            aria-checked={theme === "green"}
            aria-label="Select Forest Emerald theme"
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
                Soothing moss &amp; sage greens designed to rest your eyes and help you relax.
              </p>
            </div>
          </button>

          {/* 2. Classic Obsidian Dark */}
          <button
            type="button"
            role="radio"
            aria-checked={theme === "dark"}
            aria-label="Select Monolithic Black OLED theme"
            onClick={() => setTheme("dark")}
            className={cn(
              "p-4 rounded-xl text-left border transition-all flex flex-col justify-between relative group hover-lift-subtle",
              theme === "dark"
                ? "bg-neutral-900 border-neutral-300 ring-2 ring-neutral-400/30 shadow-lg dark:border-neutral-200"
                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-neutral-400/40"
            )}
          >
            {theme === "dark" && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white text-slate-950 flex items-center justify-center">
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

          {/* 3. Daylight Pristine Light */}
          <button
            type="button"
            role="radio"
            aria-checked={theme === "light"}
            aria-label="Select Daylight Clean theme"
            onClick={() => setTheme("light")}
            className={cn(
              "p-4 rounded-xl text-left border transition-all flex flex-col justify-between relative group hover-lift-subtle",
              theme === "light"
                ? "bg-white border-primary-600 ring-2 ring-primary-600/30 shadow-md"
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

      {/* Sound Effects & Procedural Audio Preferences Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass-card rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Volume2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Sound Effects &amp; Audio</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/25">
                  Web Audio Synthesizer
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Harmonic chime chords, slider kalimba tones, and Freddy flight whooshes for multisensory serenity.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={soundMuted ? "Unmute all sound effects" : "Mute all sound effects"}
            aria-pressed={!soundMuted}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 border",
              !soundMuted
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-muted text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {!soundMuted ? (
              <>
                <Volume2 size={15} />
                Audio Active
              </>
            ) : (
              <>
                <VolumeX size={15} />
                Muted
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 gap-3">
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-foreground">Sound Preview &amp; Verification</p>
            <p className="text-muted-foreground">
              Experience the warm Major-9th celebration arpeggio synthesized procedurally via the Web Audio API.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playCelebrationChord();
              toast.success("Playing preview chord!");
            }}
            disabled={soundMuted}
            aria-label="Play test celebration chime"
            className="px-3.5 py-1.5 rounded-xl bg-card hover:bg-muted text-foreground text-xs font-medium border border-border shadow-xs transition-all active:scale-95 disabled:opacity-40 self-start sm:self-auto shrink-0"
          >
            Play Test Chime
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

      {/* Legal & Compliance Standards Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="rounded-2xl p-6 glass-card space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Legal &amp; Privacy Governance</h2>
              <p className="text-xs text-muted-foreground">
                International compliance, encryption standards, and user autonomy
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
            <CheckCircle2 size={12} /> GDPR &amp; COPPA Gated
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          MindSync AI is built on a zero-compromise privacy framework. Your emotional reflections are encrypted at rest with AES-256, personal logs are never sold or used for public AI training, and you maintain complete self-service data erasure rights.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Link
            href="/privacy"
            target="_blank"
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground group-hover:text-primary-500 transition-colors">
                  Privacy Policy
                </p>
                <p className="text-[11px] text-muted-foreground">
                  AES-256 encryption &amp; data handling
                </p>
              </div>
            </div>
            <ExternalLink size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link
            href="/terms"
            target="_blank"
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground group-hover:text-primary-500 transition-colors">
                  Terms of Service
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Wellness disclaimers &amp; eligibility
                </p>
              </div>
            </div>
            <ExternalLink size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </div>
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

      {/* Circular Crop & Positioning Modal */}
      <AnimatePresence>
        {avatarModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-modal-heading"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="w-full max-w-md bg-card/95 text-card-foreground backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-border/80 space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm">
                    <Camera size={16} />
                  </div>
                  <div>
                    <h3 id="crop-modal-heading" className="text-base font-bold text-foreground">
                      Adjust Profile Photo
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Circular crop &amp; frame alignment</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(false)}
                  aria-label="Close photo cropper"
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Instructions */}
              <p className="text-xs text-muted-foreground text-center">
                Drag to reposition &amp; use the slider or scroll wheel to fit your face inside the circle.
              </p>

              {/* Interactive Canvas Viewport */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-[280px] h-[280px] rounded-2xl overflow-hidden bg-slate-950 shadow-inner select-none cursor-grab active:cursor-grabbing border border-border/80 group">
                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={280}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                    className="w-full h-full block"
                  />
                  {/* Floating Live Zoom Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/10 pointer-events-none select-none">
                    {Math.round(zoomScale * 100)}%
                  </div>
                </div>
              </div>

              {/* Zoom & Positioning Controls */}
              <div className="space-y-3 px-1">
                <div className="flex items-center gap-3">
                  <ZoomOut size={16} className="text-muted-foreground shrink-0" />
                  <input
                    type="range"
                    min={0.8}
                    max={3.0}
                    step={0.05}
                    value={zoomScale}
                    onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                    aria-label="Zoom profile image"
                    className="w-full accent-primary-600 dark:accent-primary-400 cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                  <ZoomIn size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-xs font-mono text-muted-foreground w-11 text-right shrink-0">
                    {Math.round(zoomScale * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => {
                      setZoomScale(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className="flex items-center gap-1 hover:text-primary-500 active:scale-95 transition-all font-medium"
                  >
                    <RotateCcw size={12} />
                    Reset Fit
                  </button>
                  <span className="text-[11px] text-muted-foreground/75">
                    Drag or pinch to adjust
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(false)}
                  disabled={avatarSaving}
                  className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={avatarSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-wellness-focus hover:opacity-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {avatarSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      Set Profile Photo
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Profile Photo Lightbox Modal ("View on Click") */}
      <AnimatePresence>
        {isViewingAvatar && user?.avatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsViewingAvatar(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lightbox-photo-heading"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 25, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-md bg-card/95 text-card-foreground backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-border/80 flex flex-col items-center text-center space-y-5"
            >
              {/* Header with Title and Actions */}
              <div className="w-full flex items-center justify-between border-b border-border/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-500">
                    <User size={16} />
                  </div>
                  <h3 id="lightbox-photo-heading" className="text-sm font-bold text-foreground">
                    Profile Photo
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {/^data:image\/(jpeg|jpg|png|webp);base64,|^https:\/\//i.test(user.avatar) && (
                    <a
                      href={user.avatar}
                      download={`${user.username || "profile"}-avatar.jpg`}
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
                      title="Download high-resolution photo"
                      aria-label="Download profile photo"
                    >
                      <Download size={16} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsViewingAvatar(false)}
                    aria-label="Close photo viewer"
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Large Circular Avatar Display with Glow */}
              <div className="avatar-circle relative group p-[3.5px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-2xl ring-4 ring-primary-500/15">
                <div className="avatar-circle w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden bg-slate-950 border-4 border-background shadow-inner">
                  <img
                    src={user.avatar}
                    alt={user.name || "Profile Photo"}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </div>
              </div>

              {/* User Identity */}
              <div>
                <h4 className="text-lg font-bold text-foreground">{user.name}</h4>
                {user.username && (
                  <p className="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400 mt-0.5">
                    @{user.username}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full flex items-center justify-center gap-2.5 pt-2 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => {
                    setIsViewingAvatar(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Camera size={13} />
                  Change Photo
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsViewingAvatar(false);
                    handleRemoveAvatar();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 border border-red-500/20 active:scale-95"
                >
                  <Trash2 size={13} />
                  Remove
                </button>

                <button
                  type="button"
                  onClick={() => setIsViewingAvatar(false)}
                  className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
