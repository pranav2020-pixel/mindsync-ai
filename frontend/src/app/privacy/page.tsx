"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck, Lock, EyeOff, UserCheck, Trash2, ArrowLeft,
  FileText, Sparkles, AlertCircle, HeartHandshake, CheckCircle2
} from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to MindSync</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active & Enforced • October 2026</span>
          </div>
        </div>

        {/* Title Banner */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient">
            MindSync AI Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your mental wellness, emotional logs, and personal reflections belong solely to you. Learn how our zero-compromise encryption and privacy-first architecture protect your data.
          </p>
        </div>

        {/* Summary Highlights Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <EyeOff size={18} />
            </div>
            <h2 className="text-xs font-bold text-foreground">Zero Data Selling</h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              We never sell, rent, broker, or monetize your emotional, habit, or journal data to third-party advertisers.
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-primary-500/15 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <h2 className="text-xs font-bold text-foreground">AES-256 Encryption</h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your personal reflections are encrypted at rest using military-grade AES-256-CBC cryptographic ciphers.
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <h2 className="text-xs font-bold text-foreground">Age Gated (13+ / 16+)</h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Strictly compliant with COPPA and GDPR-K. We do not knowingly collect information from children under age.
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 size={18} />
            </div>
            <h2 className="text-xs font-bold text-foreground">Full Erasure Control</h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Permanent 2-step account deletion directly in Settings per Apple Guideline 5.1.1 and GDPR Article 17.
            </p>
          </div>
        </div>

        {/* Detailed Legal Sections */}
        <div className="rounded-3xl p-6 sm:p-8 bg-card border border-border/80 shadow-sm space-y-8 text-sm leading-relaxed text-muted-foreground">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">1</span>
              Introduction & Data Controller
            </h2>
            <p>
              MindSync AI (&ldquo;MindSync,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is an independent cognitive wellness and productivity platform operated by Pranav Bhardwaj. This Privacy Policy details the types of personal and wellness information we collect, how it is safeguarded, how it is processed by our machine learning companion, and your legal rights under international privacy laws, including the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA/CPRA), the Children&apos;s Online Privacy Protection Act (COPPA), and Apple App Store Review Guidelines.
            </p>
            <p>
              If you have any questions regarding this Privacy Policy or wish to exercise your data rights, you may contact the primary operator at: <a href="mailto:pranavmsc2020@gmail.com" className="text-primary-600 dark:text-primary-400 font-semibold underline">pranavmsc2020@gmail.com</a>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">2</span>
              Information We Collect
            </h2>
            <p>
              We collect information that you voluntarily provide to us when setting up an account and using our wellness features:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Account Credentials:</strong> Your full name, chosen unique username, email address, password hash (salted using bcrypt with 12 rounds), and optional profile avatar.
              </li>
              <li>
                <strong className="text-foreground">Encrypted Journal Reflections:</strong> Personal writing reflections, gratitude entries, and tags. These are encrypted using AES-256-CBC at rest.
              </li>
              <li>
                <strong className="text-foreground">Wellness Tracking Metrics:</strong> Discrete mood logs (valence rating 1–10, emotion tags), habit completion events, focus timer session durations, and answers to voluntary psychometric check-ins (WHO-5, PHQ-9, GAD-7, PSS-10, PANAS, etc.).
              </li>
              <li>
                <strong className="text-foreground">AI Companion Conversations:</strong> Multi-turn chat messages exchanged with the MindSync AI companion for contextual support.
              </li>
              <li>
                <strong className="text-foreground">Minimal Device Telemetry:</strong> Anonymized client error telemetry, session timestamps, and IP addresses used solely for rate-limiting, anti-abuse, and security verification.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">3</span>
              How We Use Your Information
            </h2>
            <p>
              MindSync AI uses your information exclusively for the following operational purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To securely authenticate your identity and protect against unauthorized account takeovers.</li>
              <li>To calculate your consecutive daily habit streaks and compute gamified Wellness Level XP.</li>
              <li>To generate personalized, supportive cognitive behavioral insights and longitudinal wellness trends.</li>
              <li>To detect acute self-harm or crisis keywords and route immediate emergency lifeline resources.</li>
              <li>To respond to user-initiated bug submissions and feature suggestions in Settings.</li>
            </ul>
            <p className="p-3.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs font-medium text-foreground">
              <strong>Strict Guarantee:</strong> We do not sell, rent, trade, or share your mental health logs, reflections, or psychometric scores with commercial data brokers, advertising networks, health insurance providers, or employers.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">4</span>
              Artificial Intelligence & Third-Party Processors
            </h2>
            <p>
              MindSync integrates Google Gemini and OpenAI APIs to power natural language sentiment analysis and AI chat responses:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Google Gemini API:</strong> Processes journal sentiment analysis and conversational wellness replies via zero-data-retention enterprise endpoints. Your personal identifiers (name, email) are omitted or abstracted.
              </li>
              <li>
                <strong className="text-foreground">No Model Training:</strong> Under our enterprise API configurations, your private journal reflections and personal chats are not used to train foundational AI models.
              </li>
              <li>
                <strong className="text-foreground">Database Hosting:</strong> Primary relational data is stored within secure Neon Serverless PostgreSQL databases hosted in ISO 27001 / SOC 2 Type II compliant facilities.
              </li>
              <li>
                <strong className="text-foreground">Transactional Email:</strong> Email OTP verification codes and password recovery tokens are delivered via Resend API and secure SMTP relays.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">5</span>
              Cryptographic Security & Storage
            </h2>
            <p>
              We implement comprehensive technical and organizational safeguards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All network transmissions are strictly encrypted via TLS 1.3 / HTTPS.</li>
              <li>Personal journal content is encrypted using AES-256-CBC with distinct initialization vectors before persistence.</li>
              <li>Every internal database query enforces strict tenant isolation (<code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">where: &#123; userId: user.id &#125;</code>) to prevent cross-account information leakage.</li>
              <li>Authentication tokens employ dual JWT validation: 15-minute access tokens coupled with database-backed 90-day revocable sessions.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">6</span>
              Children&apos;s Privacy (COPPA & GDPR-K Age Gating)
            </h2>
            <p>
              MindSync AI is intended for individuals who are at least <strong className="text-foreground">13 years of age</strong> (or <strong className="text-foreground">16 years of age</strong> within the European Economic Area and United Kingdom).
            </p>
            <p>
              We do not knowingly solicit, collect, or process personal data from children under these age thresholds. If we discover that an account has been registered by an underage minor without verifiable parental consent, we will promptly terminate the account and permanently delete all stored data from our systems. Parents or guardians who believe their child has registered an unauthorized account may contact us at <a href="mailto:pranavmsc2020@gmail.com" className="text-primary-600 dark:text-primary-400 font-semibold underline">pranavmsc2020@gmail.com</a>.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">7</span>
              Your Rights & Account Deletion (Apple Guideline 5.1.1)
            </h2>
            <p>
              Regardless of your geographic location, MindSync grants all registered users full autonomy over their information:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground">Right to Access:</strong> View all your historical logs, reflections, and check-in scores directly in the application.</li>
              <li><strong className="text-foreground">Right to Rectification:</strong> Edit your profile information, username, and habit preferences at any time in Settings.</li>
              <li>
                <strong className="text-foreground">Right to Erasure (Permanent Account Deletion):</strong> Under Apple App Store Guideline 5.1.1 and GDPR Article 17, you have the right to completely and permanently purge your account. MindSync provides a built-in 2-step verification deletion flow (password + email OTP) in <strong className="text-foreground">Settings &gt; Danger Zone</strong> that permanently deletes all your journals, habits, mood logs, assessment answers, and session records with immediate database cascading deletion.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">8</span>
              Changes to This Policy & Inquiries
            </h2>
            <p>
              We may update this Privacy Policy periodically to reflect technological enhancements or regulatory revisions. When updates are published, the &ldquo;Last Updated&rdquo; date at the top of this document will be amended.
            </p>
            <div className="pt-2 text-xs">
              <p className="font-semibold text-foreground">Contact MindSync AI:</p>
              <p>Developer &amp; Operator: Pranav Bhardwaj</p>
              <p>Email: <a href="mailto:pranavmsc2020@gmail.com" className="text-primary-600 dark:text-primary-400 underline">pranavmsc2020@gmail.com</a></p>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/60">
          <p>&copy; {new Date().getFullYear()} MindSync AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground underline">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
