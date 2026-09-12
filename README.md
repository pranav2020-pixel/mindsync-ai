# MindSync AI

> A thoughtful mental wellness and productivity companion designed to help you reflect deeply, build sustainable habits, and sustain focus through empathetic AI.

[![Tech Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Express%20%7C%20PostgreSQL%20%7C%20Prisma%20%7C%20OpenAI-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## 🌐 Live Demo & Access

Experience MindSync AI live in your browser:
- **Public URL**: [https://mindsync-ai-six.vercel.app](https://mindsync-ai-six.vercel.app)
- **Demo Account**: `demo@mindsync.ai`
- **Password**: `password123`
*(Or click **Register** to create your own account)*

---

## 🎬 Live Product Walkthrough

<p align="center">
  <img src="docs/demo.gif" alt="MindSync AI Live Walkthrough" width="100%" />
</p>

*Live walkthrough showcasing Authentication, Habit Tracking with XP gamification, Pomodoro Productivity Hub, Clinical Psychological Assessments, Analytics & Reports, and AI Coaching.*

> **High-Res Video:** [▶️ Download High-Definition Video (MP4)](docs/demo.mp4)

---

## 🛠️ Technology Stack & Where Each is Used

### 1. Frontend Client (`/frontend`)
| Technology | Where & How It Is Used |
|------------|------------------------|
| **Next.js 14 (App Router)** | Full-stack React framework providing file-based routing (`/dashboard`, `/habits`, `/productivity`, `/assessments`, `/analytics`, `/journal`, `/chat`), Server and Client Components (`"use client"`), and server-side optimizations. |
| **Next.js Rewrites (`next.config.js`)** | Acts as an internal reverse proxy mapping `/api/v1/:path*` to `http://backend:4000/api/v1/:path*`. Eliminates CORS issues and allows public tunnels/domains to serve both frontend and backend on one domain. |
| **TypeScript** | Type definitions for User, Habit, Assessment, Productivity, and Mood models; ensures compile-time type safety across all UI components and API requests. |
| **Tailwind CSS** | Styling system with responsive grids, gradients, dark/light theme palettes, and modern glassmorphic cards (`backdrop-blur`). |
| **Framer Motion** | Micro-interactions, animated route transitions, modal popovers, animated questionnaire progress indicators, and completion animations. |
| **Recharts** | Interactive charts including Weekly Focus Bar Charts in `/productivity`, Sleep vs. Mood correlation lines in `/analytics`, and habit streak heatmaps. |
| **Lucide React** | Consistent iconography across navigation menus, status pills, metrics, and achievement badges. |
| **Canvas Confetti** | Visual celebration triggers when users complete assessments or claim habit XP milestones. |

### 2. Backend API (`/backend`)
| Technology | Where & How It Is Used |
|------------|------------------------|
| **Node.js & Express** | RESTful API server routing client requests, handling business logic, and coordinating services under `/api/v1/*`. |
| **TypeScript** | Structured controllers (`auth.controller.ts`, `habit.controller.ts`, etc.), middleware, and typed service layers. |
| **JWT (`jsonwebtoken`) & `bcryptjs`** | Secure authentication pipeline: salted password hashing and stateless Access & Refresh Token verification. |
| **Express Rate Limit** | Protection against brute-force attacks on `POST /api/v1/auth/login` and `POST /api/v1/auth/register` with `trust proxy` support for tunnels and reverse proxies. |
| **Helmet & CORS** | Security headers (CSP, HSTS, frameguard) and cross-origin resource sharing controls. |
| **Morgan & Winston** | Centralized HTTP request logging and error handling. |

### 3. Database & Caching
| Technology | Where & How It Is Used |
|------------|------------------------|
| **PostgreSQL 16** | Primary relational database storing users, encrypted journal reflections, mood entries, habits, assessments, and productivity logs. |
| **Prisma ORM** | Type-safe database schema (`schema.prisma`), queries, migrations, and relationship management. |
| **Prisma Seeder (`seed.ts`)** | Pre-populates the database with clinical assessment batteries (PSS-10, WHO-5, BRS), achievement badges, and demo user data. |
| **Redis 7** | In-memory key-value cache used for session storage, caching AI insights, and fast rate-limit tracking. |

### 4. Artificial Intelligence & NLP (`/backend/src/services/ai.service.ts`)
| Technology | Where & How It Is Used |
|------------|------------------------|
| **OpenAI GPT-4 / GPT-3.5 Turbo** | Powers conversational AI coach (`/chat`), automated journal sentiment/stress analysis (`/journal`), and personalized psychological assessment interpretations (`/assessments`). |
| **Fail-Safe Heuristic Engine** | Built-in fallback algorithms that ensure chat, journal reflections, and burnout analysis function seamlessly even when an OpenAI API key is not configured. |

### 5. DevOps, Infrastructure & Networking
| Technology | Where & How It Is Used |
|------------|------------------------|
| **Docker & Docker Compose** | Multi-container orchestration managing `frontend`, `backend`, `postgres`, `redis`, and `tunnel` in isolated network bridges. |
| **Cloudflare Tunnel (`cloudflared`)** | Secure zero-trust HTTPS tunnel exposing `frontend:3000` to the internet (`*.trycloudflare.com`) without opening router firewall ports. |

---

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/mindsync
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
OPENAI_API_KEY=sk-...
PORT=4000
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## API Documentation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/me` | GET | Current user profile |
| `/api/v1/journals` | GET/POST | Journal entries & AI analysis |
| `/api/v1/moods` | GET/POST | Mood logs & timeline |
| `/api/v1/habits` | GET/POST/PATCH | Habit tracking |
| `/api/v1/assessments` | GET/POST | Psychology assessments |
| `/api/v1/productivity` | GET/POST | Productivity metrics |
| `/api/v1/chat` | POST | AI chatbot conversations |
| `/api/v1/insights` | GET | AI-generated insights |
| `/api/v1/reports` | GET | Export reports (PDF/CSV) |

## Database Schema

See `backend/prisma/schema.prisma` for the complete normalized schema including Users, JournalEntries, MoodLogs, ProductivityLogs, HabitLogs, Assessments, AIInsights, ChatHistory, and more.

## Architecture

```
+-------------+      +-------------+      +-------------+
|   Next.js   |------|   Express   |------|  PostgreSQL |
|  Frontend   |      |   Backend   |      |   (Prisma)  |
+-------------+      +-------------+      +-------------+
                            |
                            v
                     +-------------+
                     |    Redis    |
                     |    Cache    |
                     +-------------+
                            |
                            v
                     +-------------+
                     |   OpenAI    |
                     |     API     |
                     +-------------+
```

## 🧪 Testing & Verification Guide

You can test the entire platform either locally (`http://localhost:3000`) or via the [Live Public Link](https://clock-peripheral-eva-acknowledged.trycloudflare.com).

### 🔑 Authentication & Login
1. Navigate to the login page:
   - **Email**: `demo@mindsync.ai`
   - **Password**: `password123`
2. Alternatively, click **Register** to create a fresh user profile.
3. Observe that after signing in, access and refresh tokens are securely stored and the dashboard loads Alex Chen's profile.

---

### 📋 Feature-by-Feature Testing Steps

#### 1. Daily Habit Tracker (`/habits`)
- **XP & Level Progression**: View your current level (e.g., Level 4 Mindful Achiever), progress bar, and 30-day completion rate.
- **Check-off Habits**: Toggle checkboxes next to habits like *Morning Meditation*, *Deep Work Reading*, or *Hydration*. Notice the instant XP sound/visual animation, confetti burst, and streak increment.
- **Create Custom Habit**: Click **"+ New Habit"**, fill in a habit title (e.g. "Evening Walk"), set a daily target and unit (e.g. "30 mins"), pick a color accent, and click **Create**. The new habit renders instantly in your daily list.
- **Milestone Achievements**: Scroll down to the Achievements Gallery to verify unlocked badges (*First Reflection*, *Streak Starter*, *Mindful Master*).

#### 2. Productivity Hub (`/productivity`)
- **Pomodoro Focus Timer**:
  - Select an interval mode: **Focus (25m)**, **Short Break (5m)**, or **Long Break (15m)**.
  - Test the **+5m** and **-5m** interval adjustment buttons.
  - Click **Start** to run the animated SVG ring timer; click **Pause** / **Reset** to test controls.
  - When a focus session finishes, it automatically commits focus minutes and blocks to the backend.
- **Flow & Task Logging**: Click **"+1 Task"** to quickly log a completed task. Drag the **Deep Work Rating slider (1–10)** and click **"Save Log"**.
- **Burnout Risk Meter**: Check the real-time calculated burnout risk score (Low / Moderate / High) derived from recent sleep and stress factors, alongside personalized recovery recommendations.
- **Weekly Velocity Chart**: Inspect the Recharts bar chart displaying weekly focus hours and completed task counts.

#### 3. Psychological Assessments (`/assessments`)
- **Assessment Catalog**: Browse standardized clinical questionnaires including **PSS-10** (Perceived Stress Scale), **WHO-5** (Well-Being Index), and **BRS** (Brief Resilience Scale).
- **Interactive Questionnaire Runner**:
  - Click **"Take Assessment"** on PSS-10.
  - Step through questions 1 to 10 using the Likert-scale answer buttons (`Never` to `Very Often`).
  - Notice smooth slide transitions, questions-remaining counter, and progress bar.
- **AI Clinical Synthesis**:
  - Upon completing the final question, submit the assessment.
  - View your calculated total score, sub-scale breakdown (e.g. Coping vs. Overload), and empathetic AI clinical reflection.

#### 4. Holistic Analytics & Reports (`/analytics`)
- **Correlation Visualizations**:
  - View the **Sleep vs. Daytime Mood** scatter/line chart.
  - View the **Stress vs. Energy Levels** tracking chart.
- **AI Discovered Patterns**: Review AI-detected correlation cards (e.g., *"Getting 7.5+ hours of sleep improves your afternoon focus by 34%"*). Test clicking the **Pin** button and mark patterns as read.
- **Export Reports**:
  - Under the Report Center, select report period (**Last 30 Days**) and format (**PDF** or **CSV**).
  - Click **"Generate & Download Report"** to receive the exported wellness summary file.

#### 5. AI Journal & Reflection (`/journal`)
- Create a new entry describing your day or challenges.
- Click **Analyze & Save** — observe automatic emotion classification, sentiment scoring, and empathetic AI reflection generated in real time.

#### 6. AI Coaching Chatbot (`/chat`)
- Open the AI Coach chat interface.
- Send a message (e.g., *"I'm feeling overwhelmed with deadlines today, how can I prioritize?"*).
- Receive empathetic, actionable coaching guidance. Test built-in safety guardrails.

---

### 💻 Automated Test Suite

Run unit and integration tests across both frontend and backend:

```bash
# Run backend tests (Auth, Controllers, AI Services)
cd backend
npm test

# Run frontend tests (Component testing & builds)
cd frontend
npm test

# Run full Next.js production build verification
cd frontend
npm run build
```

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Render/Railway)
Push to GitHub and connect your Render/Railway account. Set environment variables in the dashboard.

### Database (Neon)
Create a Neon PostgreSQL project and update `DATABASE_URL`.

## Safety & Ethics

- **Never diagnoses** mental health conditions
- **Always displays** medical disclaimer
- **Surfaces crisis resources** if self-harm language is detected
- **Encrypts** sensitive journal content at rest
- **GDPR-compliant** data export and deletion

## License

MIT License

## Future Roadmap

- [ ] Voice Journal with Speech-to-Text
- [ ] Google Fit / Apple Health integration
- [ ] ML-based mood prediction
- [ ] Community challenges & anonymous sharing
- [ ] Calendar integration
- [ ] Mobile app (React Native)
