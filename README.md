<p align="center">
  <img src="frontend/public/icons/icon-192x192.png" width="96" height="96" alt="MindSync AI Logo" style="border-radius: 20%;" />
</p>

<h1 align="center">MindSync AI</h1>

<p align="center">
  <em>A healthier mind ✧ A brighter you</em><br />
  <strong>An intelligent, privacy-first mental wellness and mindful productivity platform bridging clinical psychology, cognitive flow, and empathetic AI.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-14.2%20(App%20Router)-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express-4.22-000000?style=for-the-badge&logo=express" alt="Express" /></a>
  <a href="https://www.postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API"><img src="https://img.shields.io/badge/Web%20Audio-Procedural%20Synthesis-8B5CF6?style=for-the-badge" alt="Web Audio" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge" alt="License" /></a>
</p>

---

## 🌐 Live Web Application

Experience MindSync AI live in your browser:

### 🚀 **[https://mindsync-ai-six.vercel.app](https://mindsync-ai-six.vercel.app)**

| Demo Account | Password | Experience |
|:---|:---|:---|
| `demo@mindsync.ai` | `password123` | Pre-populated demo profile (or click **Register** to create your own account) |

---

## 📑 Table of Contents

- [🌐 Live Web Application](#-live-web-application)
- [Overview & Philosophy](#-overview--philosophy)
- [Key Features](#-key-features)
  - [🎨 Handcrafted Illustrated Wellness Reports (A4 PDF & Print)](#1--handcrafted-illustrated-wellness-reports-a4-pdf--print)
  - [🎵 Zero-Asset Procedural Web Audio Soundscapes](#2--zero-asset-procedural-web-audio-soundscapes)
  - [⏱️ Pomodoro Flow & Burnout Prevention Engine](#3-⏱️-pomodoro-flow--burnout-prevention-engine)
  - [🧠 Clinical Psychological Assessment Battery](#4-🧠-clinical-psychological-assessment-battery)
  - [🏆 15-Tier Gamification & Milestone Badges](#5-🏆-15-tier-gamification--milestone-badges)
  - [🌍 Location-Aware Circadian Greeting Engine](#6-🌍-location-aware-circadian-greeting-engine)
  - [🔒 Encrypted Journaling & Crisis Safety Net](#7-🔒-encrypted-journaling--crisis-safety-net)
  - [🤖 Freddy AI Companion & 3D Interactive Mascot](#8-🤖-freddy-ai-companion--3d-interactive-mascot)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [REST API Reference](#-rest-api-reference)
- [Safety, Ethics & Data Privacy](#-safety-ethics--data-privacy)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 💡 Overview & Philosophy

Modern productivity tools often encourage chronic overwork, while mental wellness apps isolate self-care from daily responsibilities. **MindSync AI** bridges this divide by synthesizing **clinical psychology (CBT, burnout metrics, validated assessments)** with **actionable productivity (Pomodoro rhythms, deep work tracking, habit streaks)**.

Designed with an eye-soothing biophilic theme, true monolithic dark mode, and bespoke editorial pastel reporting, MindSync AI offers a serene sanctuary for mental clarity, steady focus, and sustained personal growth.

---

## ✨ Key Features

### 1. 🎨 Handcrafted Illustrated Wellness Reports (A4 PDF & Print)
* **Bespoke Editorial Aesthetics:** Generates high-fidelity illustrated wellness reports rendered on warm linen paper (`#faf8f5`) featuring custom cursive lettering (`Caveat`), delicate botanical sprigs, and watercolor-style artwork.
* **Inline Watercolor Sunrise Banner:** Vector SVG artwork depicting layered misted mountains, sunrise glow, leafy sprigs, and the uplifting motto *“Your well-being matters ♡”*.
* **11 Structured Visual Cards:**
  1. **Quick Summary:** 6 metrics (*Mood, Stress, Energy, Sleep, Exercise Days, Journal Entries*) with pastel icon badges and progress bars.
  2. **Overall Well-being:** Large score display (e.g. `7.0/10 [Good]`), full-width gradient progress bar, and positive affirmation.
  3. **Mood Overview:** 7-day vector line chart (Mon–Sun) with data coordinates, shaded area, and lightbulb insight note.
  4. **Stress Level:** `4.7/10` Moderate badge, progress fill, and 4 actionable stress reduction tips.
  5. **Energy & Sleep:** Energy score + sleep quality in hours with clinical advice.
  6. **Exercise & Activity:** Active days tracker (`0/7`) with 7 weekday circular indicators.
  7. **Journal Entries:** Total count, latest reflection snippet, and mint green botanical quote card.
  8. **AI Insights:** 5 bulleted key takeaways + purple action card *“Your Next Steps”* with 4 checkable goals.
  9. **Footer:** Delicate botanical leaf sprigs, center heart `♡`, and legal medical disclaimer.
* **Dual Export Engine:**
  * **1-Click High-Res PDF:** Client-side 2.5× retina rasterization via `html2canvas` and `jsPDF`, perfectly proportioned for single-page A4 export.
  * **Vector Print / Save to PDF:** Built-in `@media print` rules for browser vector printing with zero rasterization artifacts.

---

### 2. 🎵 Zero-Asset Procedural Web Audio Soundscapes
* **Pure Client-Side Synthesis:** Synthesizes 4 continuous natural soundscapes in real time via the native Web Audio API with zero external audio assets or bandwidth consumption:
  * 🌧️ **Gentle Rain:** 820Hz bandpass-filtered pink noise with dual dynamic gain modulation.
  * 🌊 **Zen Ocean Waves:** 0.09Hz tide LFO rolling low-frequency surf with gentle foam crashes.
  * 🌲 **Forest Breeze & Birds:** Resonant wind rustle with stochastic avian frequency sweeps.
  * 🧘 **Alpha Binaural Beats:** 10Hz stereo frequency offset for deep cognitive resonance and focused flow.
* **Gamified Soundscape Progression:** Gated behind Level 10 unlock progression with clean lock state indicators and progress tracker.

---

### 3. ⏱️ Pomodoro Flow & Burnout Prevention Engine
* **Dynamic Interval Timer:** Flexible Pomodoro timer with preset chips (`1m`, `5m`, `10m`, `15m`, `25m`, `45m`, `60m`) and fine-grained `+1m` / `-1m` adjustments.
* **Accurate Session Logging:** Commits exact logged minutes and blocks to the backend database; displays human-readable units (e.g., `1 min` vs `0.4 hrs`).
* **Burnout Risk Index:** Real-time risk scoring (Low, Moderate, High) computed dynamically from recent sleep deficits, chronic stress levels, and deep work ratios.
* **Weekly Focus Velocity:** Recharts-powered visualization of completed tasks and deep work hours across the past 7 days.

---

### 4. 🧠 Clinical Psychological Assessment Battery
* **Standardized Clinical Instruments:**
  * **PSS-10 (Perceived Stress Scale):** Assesses feelings of unpredictability, overload, and stress over the preceding month.
  * **WHO-5 (Well-Being Index):** World Health Organization validated 5-item index measuring positive psychological well-being.
  * **BRS (Brief Resilience Scale):** Measures the ability to bounce back and recover from stress.
* **Stepped Questionnaire Runner:** Smooth slide transitions, Likert-scale buttons, progress indicator, and automated subscale summation.
* **AI Clinical Synthesis:** Provides empathetic clinical interpretation, percentile norms, and evidence-based self-care suggestions.

---

### 5. 🏆 15-Tier Gamification & Milestone Badges
* **Progression Hierarchy:** 15 distinct rank tiers spanning from *Novice Inquirer* to *Transcendent Sage*.
* **Multi-Activity XP Engine:** Awards experience points for journal entries, habit check-offs, mood check-ins, and focus blocks.
* **Milestone Achievements:**
  * 🧠 **Deep Thinker (+150 XP):** Unlocks upon completing 5 cumulative focus sessions.
  * 🔥 **Streak Starter:** Awarded for consistent 3-day habit streaks.
  * 🧘 **Mindful Master:** Awarded for maintaining daily check-ins.
* **Celebratory Feedback:** Dynamic confetti bursts (`canvas-confetti`) and real-time celebratory sound cues on milestone unlocks.

---

### 6. 🌍 Location-Aware Circadian Greeting Engine
* **5-Phase Circadian Detection:** Replaces generic greetings with true astronomical circadian phases:
  * `MIDNIGHT` (00:00–04:59) • *Rest & Reflect*
  * `MORNING` (05:00–11:59) • *Energize & Focus*
  * `AFTERNOON` (12:00–16:59) • *Sustain & Create*
  * `EVENING` (17:00–20:59) • *Unwind & Review*
  * `NIGHT` (21:00–23:59) • *Prepare for Rest*
* **Smart Dual-Tier Geolocation:** Combines browser Geolocation API reverse geocoding with IANA timezone detection (`Intl.DateTimeFormat`) and local storage caching (e.g., *Monday, Oct 26 • 2:00 AM • Delhi, India*).

---

### 7. 🔒 Encrypted Journaling & Crisis Safety Net
* **AES-256 Encryption at Rest:** Personal journal entries and reflections are encrypted using authenticated cryptography before persisting to PostgreSQL.
* **AI Emotion Breakdown:** Automated detection of primary emotional themes, sentiment valence, and psychological cognitive distortions.
* **Crisis Safety Guardrails:** Immediate keyword detection surfaces emergency mental health hotlines (**988 Suicide & Crisis Lifeline**, **Tele-MANAS**, **Crisis Text Line**) alongside persistent medical disclaimers.

---

### 8. 🤖 Freddy AI Companion & 3D Interactive Mascot
* **Empathetic AI Companion:** Multi-turn chat grounded in Cognitive Behavioral Therapy (CBT) and non-judgmental active listening.
* **Interactive 3D WebGL Companion:** Built with Three.js and React Three Fiber; features cursor tracking, mood reactions, and platform tour guidance.

---

## 🏛️ System Architecture

```text
                                  +---------------------------------------+
                                  |         Next.js 14 Frontend           |
                                  |  (React 18 • TypeScript • Tailwind)   |
                                  +---------------------------------------+
                                         |                         |
                           Web Audio API |                         | REST API (HTTP/JSON)
                                         v                         v
                       +------------------------+      +------------------------+
                       | Procedural Soundscapes |      |   Express Backend API  |
                       |  (Rain, Waves, Alpha)  |      |   (TypeScript • Node)  |
                       +------------------------+      +------------------------+
                                                                   |
                                              +--------------------+--------------------+
                                              |                    |                    |
                                              v                    v                    v
                                     +-----------------+  +-----------------+  +-----------------+
                                     |  PostgreSQL 16  |  |     Redis 7     |  | Google Gemini / |
                                     |  (Prisma ORM)   |  | (Session/Cache) |  |   OpenAI GPT    |
                                     +-----------------+  +-----------------+  +-----------------+
```

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | **Next.js 14 (App Router)** | Full-stack React framework with server and client components |
| **Language** | **TypeScript 5.9** | Compile-time static type safety across frontend and backend |
| **Styling & Design** | **Tailwind CSS 3.4** | Utility-first styling with custom biophilic and dark palettes |
| **Animations & UI** | **Framer Motion 11** | Fluid route transitions, modal popups, and micro-interactions |
| **Data Visualization** | **Recharts 2.15** | Interactive velocity bars, correlation lines, and habit charts |
| **Document Export** | **html2canvas & jsPDF** | 2.5× retina illustrated A4 PDF generation and downloading |
| **Sound Synthesis** | **Web Audio API** | Real-time procedural white/pink noise and binaural oscillators |
| **Backend Framework** | **Node.js & Express 4.22** | RESTful API controllers, middleware, and route orchestration |
| **Database & ORM** | **PostgreSQL 16 & Prisma 5.22** | Relational data persistence, schema migrations, and type-safe queries |
| **In-Memory Cache** | **Redis 7 (ioredis)** | Session token caching, rate-limit tracking, and AI cache |
| **Security & Auth** | **JWT & bcryptjs** | Stateless access/refresh token verification & salted password hashing |
| **OAuth & Mail** | **Google OAuth & Nodemailer** | Google 1-click authentication and Gmail 6-digit OTP verification |
| **AI Integration** | **OpenAI / Google Gemini** | Psychological journaling synthesis, chat coaching, and report insights |

---

## 📁 Repository Structure

```text
mindsync-ai/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # Normalized database schema (14 models)
│   │   └── seed.ts                  # Assessment questions, achievements, and demo seed
│   ├── src/
│   │   ├── controllers/             # Express request handlers (auth, habit, report, etc.)
│   │   ├── middleware/              # Auth guards, rate limiters, validation
│   │   ├── routes/                  # Express route definitions under /api/v1/*
│   │   ├── services/                # Business logic (ai, report, achievement, auth)
│   │   └── server.ts                # Express server entry point
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   ├── icons/                   # PWA squircle & maskable icons (192px, 512px)
│   │   ├── manifest.json            # Web App Manifest
│   │   └── sw.js                    # Offline service worker
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages
│   │   │   ├── analytics/           # Analytics, correlation graphs, and report center
│   │   │   ├── assessments/         # Clinical assessment catalog & runner
│   │   │   ├── chat/                # Empathetic AI coaching interface
│   │   │   ├── habits/              # Habit tracking, XP levels, and rewards modal
│   │   │   ├── journal/             # Encrypted journal reflections & sentiment analysis
│   │   │   ├── productivity/        # Pomodoro timer, burnout risk meter, soundscapes
│   │   │   └── layout.tsx           # Global app layout with Caveat font & providers
│   │   ├── components/
│   │   │   ├── reports/             # WellnessReportView & WellnessReportModal
│   │   │   └── ui-states/           # Soundscapes card, PWA banner, level modal
│   │   └── lib/                     # Sound engine, circadian location service, chart themes
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 📡 REST API Reference

| Domain | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | Register new account with password |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate user & issue tokens |
| **Auth** | `POST` | `/api/v1/auth/google` | Authenticate via Google OAuth token |
| **Auth** | `POST` | `/api/v1/auth/refresh` | Refresh access token using refresh token |
| **Auth** | `GET` | `/api/v1/auth/me` | Retrieve authenticated user profile |
| **Mood** | `GET` | `/api/v1/moods` | Retrieve user mood logs & timeline |
| **Mood** | `POST` | `/api/v1/moods` | Record daily mood, sleep, stress & energy |
| **Mood** | `GET` | `/api/v1/moods/stats` | Compute aggregate mood & circadian metrics |
| **Productivity** | `GET` | `/api/v1/productivity/stats`| Retrieve weekly velocity & burnout risk |
| **Productivity** | `POST` | `/api/v1/productivity` | Log focus blocks, task counts & flow score |
| **Habits** | `GET` | `/api/v1/habits` | Fetch user habits, streaks & XP level |
| **Habits** | `POST` | `/api/v1/habits` | Create custom habit with target & unit |
| **Habits** | `PATCH`| `/api/v1/habits/:id/toggle` | Check off habit for date & award XP |
| **Assessments** | `GET` | `/api/v1/assessments` | Browse catalog of standardized tests |
| **Assessments** | `POST`| `/api/v1/assessments/submit` | Submit test answers & get AI clinical report |
| **Journal** | `GET` | `/api/v1/journals` | Retrieve encrypted journal history |
| **Journal** | `POST`| `/api/v1/journals` | Encrypt & save journal reflection + AI insights |
| **Reports** | `GET` | `/api/v1/reports` | List generated export reports |
| **Reports** | `GET` | `/api/v1/reports/monthly-wellness` | Get live illustrated report data & preview |
| **Reports** | `POST`| `/api/v1/reports` | Generate & record monthly wellness report |
| **Chat** | `POST` | `/api/v1/chat` | Send message to empathetic AI coach |

---

## 🛡️ Safety, Ethics & Data Privacy

* **Non-Diagnostic Clarification:** MindSync AI is an emotional wellness and productivity assistant. It does **not** provide formal psychiatric diagnoses or replace licensed clinical intervention. Persistent disclaimers accompany all reports and assessments.
* **Encrypted At Rest:** Sensitive reflections in the Journal module are safeguarded with **AES-256** encryption at rest.
* **Proactive Crisis Intervention:** Real-time sentiment filters immediately surface verified 24/7 emergency hotlines (e.g., 988 Suicide & Crisis Lifeline, Tele-MANAS) if high-risk language is detected.
* **Privacy & Data Autonomy:** Users maintain total control over their data with 1-click complete account deletion and data export under `Settings > Danger Zone`.

---

## 🗺️ Roadmap

- [x] **Procedural Ambient Soundscapes Engine (Web Audio)**
- [x] **Location-Aware Circadian Phase Greeting System**
- [x] **Bespoke Pastel Illustrated Wellness Report PDF & Print Engine**
- [x] **Level Progression Matrix & Deep Thinker Milestone Badges**
- [ ] **Native Mobile App Store Packaging (Capacitor for Android & iOS)**
- [ ] **Wearables Integration (Apple HealthKit & Google Health Connect)**
- [ ] **Offline IndexedDB Sync for Progressive Web App**
- [ ] **Multi-Language Localization (Hindi, Spanish, French, German)**

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

---

<p align="center">
  Crafted with care for mindful focus and psychological balance ✧ <strong>MindSync AI Team</strong>
</p>
