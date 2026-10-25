"use client";

import Link from "next/link";
import {
  FileText, AlertTriangle, ShieldAlert, HeartPulse, UserCheck,
  Scale, ArrowLeft, CheckCircle2, PhoneCall
} from "lucide-react";

export default function TermsOfServicePage() {
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
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span>Effective • October 2026</span>
          </div>
        </div>

        {/* Title Banner */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
            <FileText size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gradient">
            MindSync AI Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using MindSync AI. By registering, logging in, or accessing our platform, you agree to be bound by these legal terms.
          </p>
        </div>

        {/* Critical Medical Disclaimer Alert Box */}
        <div className="rounded-3xl p-6 bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-base text-amber-800 dark:text-amber-300">
            <HeartPulse size={22} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Important Medical &amp; Crisis Disclaimer</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-amber-950/80 dark:text-amber-200/90 font-medium">
            <strong>MINDSYNC AI IS NOT A MEDICAL PROVIDER OR CLINICAL THERAPY SERVICE.</strong> The content, habit tracking, AI responses, psychometric check-ins (e.g., WHO-5, PHQ-9, GAD-7), and insights provided through MindSync AI are strictly for personal self-reflection, mindfulness, and educational wellness purposes. MindSync AI does not provide medical diagnosis, psychiatric treatment, clinical psychology, or prescription care.
          </p>
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-black/40 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <PhoneCall size={16} className="text-rose-500 shrink-0" />
              <span className="font-semibold text-foreground">
                In immediate crisis or feeling unsafe? Contact emergency services right now:
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-bold">
              <span className="text-rose-600 dark:text-rose-400">US/Canada: 988</span>
              <span className="text-rose-600 dark:text-rose-400">UK: 111 / 999</span>
              <span className="text-rose-600 dark:text-rose-400">EU: 112</span>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="rounded-3xl p-6 sm:p-8 bg-card border border-border/80 shadow-sm space-y-8 text-sm leading-relaxed text-muted-foreground">

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">1</span>
              Agreement to Terms
            </h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and MindSync AI (&ldquo;MindSync,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), operated by Pranav Bhardwaj. By creating an account, accessing, or interacting with MindSync AI via web, Progressive Web App (PWA), or official native mobile packaging, you acknowledge that you have read, understood, and agree to be bound by all of these Terms. If you do not agree, you must immediately discontinue use of the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">2</span>
              Eligibility &amp; Age of Consent (COPPA &amp; GDPR-K)
            </h2>
            <p>
              To use MindSync AI, you must be at least <strong className="text-foreground">13 years of age</strong> if residing in the United States, or at least <strong className="text-foreground">16 years of age</strong> if residing within the European Economic Area (EEA) or United Kingdom.
            </p>
            <p>
              By registering an account, you represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You meet the minimum legal age requirement in your jurisdiction.</li>
              <li>You possess the legal capacity to enter into these Terms.</li>
              <li>You will not provide false, deceptive, or misleading account registration information.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">3</span>
              Account Security &amp; Credentials
            </h2>
            <p>
              You are responsible for safeguarding your login credentials (email, password, and email verification OTPs). You must notify us immediately upon suspecting any unauthorized access to your account. MindSync AI is not liable for any losses or damages caused by unauthorized use of your credentials resulting from user negligence.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">4</span>
              Nature of AI Companion &amp; Psychometric Check-Ins
            </h2>
            <p>
              MindSync AI provides an artificial intelligence companion powered by Google Gemini and OpenAI models, alongside recognized psychometric screening tools (such as WHO-5, PHQ-9, GAD-7, and PSS-10). You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The AI companion is a software program designed for supportive dialog, mindfulness prompting, and habit encouragement. It does not possess medical knowledge, human empathy, or clinical licensure.</li>
              <li>Psychometric check-in scores and AI reflections are calculated indicators intended solely to assist personal self-discovery and are not formal clinical diagnoses.</li>
              <li>Never ignore or delay seeking professional medical advice because of something you have read on MindSync AI.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">5</span>
              Acceptable Use &amp; Prohibited Conduct
            </h2>
            <p>
              You agree not to engage in any of the following prohibited behaviors:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Attempting to reverse-engineer, decompile, or extract the underlying algorithms, 3D WebGL shaders, or source code of MindSync AI.</li>
              <li>Using automated scraping tools, bots, or brute-force scripts against our authentication or API endpoints.</li>
              <li>Using the AI companion to generate unlawful, harassing, defamatory, abusive, or harmful material.</li>
              <li>Attempting to circumvent our database scoping or cryptographic protections.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">6</span>
              Intellectual Property &amp; User Reflections
            </h2>
            <p>
              <strong className="text-foreground">Your Content:</strong> You retain 100% intellectual property ownership of your journal entries, personal reflection text, and custom habit notes. MindSync AI does not claim ownership over any user-authored wellness content.
            </p>
            <p>
              <strong className="text-foreground">Our Platform:</strong> The MindSync AI branding, custom 3D WebGL shaders, interactive tour systems, procedural audio synthesizer, interface designs, and codebase are the proprietary intellectual property of Pranav Bhardwaj and MindSync AI.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">7</span>
              Disclaimer of Warranties &amp; Limitation of Liability
            </h2>
            <p>
              MINDSYNC AI IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED AVAILABILITY.
            </p>
            <p>
              TO THE FULLEST EXTENT PERMISSIBLE BY APPLICABLE LAW, IN NO EVENT SHALL MINDSYNC AI, ITS OPERATOR, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF, OR INABILITY TO USE, THE PLATFORM.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3 border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-mono">8</span>
              Contact &amp; Legal Notices
            </h2>
            <p>
              If you have any questions or require legal clarification regarding these Terms of Service, please contact:
            </p>
            <div className="pt-2 text-xs">
              <p className="font-semibold text-foreground">MindSync AI Legal &amp; Governance</p>
              <p>Operator: Pranav Bhardwaj</p>
              <p>Email: <a href="mailto:pranavmsc2020@gmail.com" className="text-primary-600 dark:text-primary-400 underline">pranavmsc2020@gmail.com</a></p>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/60">
          <p>&copy; {new Date().getFullYear()} MindSync AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground underline">
              Privacy Policy
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
