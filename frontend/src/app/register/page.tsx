"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Loader2, KeyRound, RefreshCw, ArrowLeft, CheckCircle2, ArrowRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "react-hot-toast";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const [step, setStep] = useState<"FORM" | "VERIFY">("FORM");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Countdown timer for resending verification code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleInitiateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanName = form.name.trim();
    const cleanEmail = form.email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your full name");
      return;
    }

    // Strict email domain validation (rejects invalid emails like vasu@12)
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError("Please provide a valid email address with a domain (e.g. yourname@gmail.com)");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name: cleanName,
        email: cleanEmail,
        password: form.password,
      });

      if (res?.requireVerification) {
        setStep("VERIFY");
        setCountdown(60);
        if (res.devCode) {
          setDevCode(res.devCode);
        }
        toast.success(res.message || "Verification code sent to your email!");
      } else {
        toast.success("Account created successfully!");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please check your information and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        code: cleanCode,
      });
      toast.success("Email verified! Account created successfully.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid or expired verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setCountdown(60);
      if (res?.devCode) {
        setDevCode(res.devCode);
      }
      toast.success(res?.message || "A new verification code has been sent!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError("Google authentication response was incomplete.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success("Account created and verified with Google!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to register with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-Up failed or was cancelled. Please try again.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl"
      >
        {/* Header branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/25">
            <img src="/logo.png" alt="MindSync AI" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === "FORM" ? "Create account" : "Verify your email"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {step === "FORM"
              ? "Start your AI-powered wellness journey"
              : `Enter the 6-digit code sent to ${form.email}`}
          </p>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 mb-4 rounded-xl bg-wellness-stress/10 border border-wellness-stress/20 text-wellness-stress text-xs text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {step === "FORM" ? (
          <>
            {/* Google Sign-Up Button */}
            <div className="mb-6">
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="signup_with"
                  width="360"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-3 bg-slate-900/90 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Or with verified email
              </span>
            </div>

            <form onSubmit={handleInitiateRegister} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                    placeholder="you@gmail.com"
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 px-0.5">
                  Must be a valid email address with a domain (e.g. name@gmail.com)
                </p>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-white px-1.5 py-0.5 rounded transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-wellness-focus text-white font-medium hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 text-sm"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <span>Continue & Verify Email</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  6-Digit Code sent to <strong className="text-white">{form.email}</strong>
                </label>
                <button
                  type="button"
                  onClick={() => { setStep("FORM"); setError(""); }}
                  className="text-xs text-primary-400 hover:underline"
                >
                  Edit email
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-center text-lg tracking-widest font-mono outline-none focus:border-primary-500 transition-colors"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
                Check your Gmail / email inbox or spam folder for your 6-digit code.
              </p>
            </div>

            {/* Dev Code Autofill Banner (Only in local development) */}
            {process.env.NODE_ENV === "development" && devCode && (
              <div
                onClick={() => setOtpCode(devCode)}
                className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs flex items-center justify-between cursor-pointer hover:bg-primary-500/20 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-primary-400" />
                  <span>Dev Preview Code: <strong>{devCode}</strong></span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400">Click to fill</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-wellness-focus text-white font-medium hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 text-sm"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Activate Account"}
            </button>

            <div className="text-center pt-1">
              {countdown > 0 ? (
                <span className="text-xs text-muted-foreground">
                  Resend code in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-xs text-primary-400 hover:underline flex items-center gap-1 mx-auto"
                >
                  <RefreshCw size={12} />
                  <span>Resend verification code</span>
                </button>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => { setStep("FORM"); setError(""); }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
              >
                <ArrowLeft size={13} /> Change email or details
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
