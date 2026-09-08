# MindSync AI

> AI-Powered Mental Wellness & Productivity Platform

[![Tech Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Express%20%7C%20PostgreSQL%20%7C%20Prisma%20%7C%20OpenAI-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## Overview

MindSync AI is a premium SaaS-grade platform that combines mental wellness tracking, productivity analytics, AI-powered journaling, psychology assessments, habit building, and empathetic AI coaching into one seamless experience.

## Features

- **AI Journal Analysis** — Sentiment, emotion detection, stress level, burnout risk, and personalized reflections
- **Mood & Productivity Tracking** — Daily logs with correlation analytics and predictive insights
- **Psychology Assessments** — PANAS, Big Five, Perceived Stress Scale, Resilience, Self-Esteem, Well-being Index
- **Habit Tracker** — Streaks, XP system, badges, achievements, and AI-powered recommendations
- **AI Chatbot** — Emotionally supportive coach with context memory and safety guardrails
- **Beautiful Analytics** — Mood heatmaps, productivity graphs, radar charts, correlation matrices
- **Reports** — Export PDF/CSV wellness and productivity reports
- **Privacy First** — End-to-end journal encryption, GDPR-friendly, secure JWT auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express, TypeScript, REST API |
| Database | PostgreSQL, Prisma ORM |
| AI | OpenAI GPT-4, Embedding-based insights |
| Cache | Redis |
| Auth | JWT (Access + Refresh), bcrypt |
| Deploy | Docker, Vercel, Render |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- OpenAI API Key

### 1. Clone & Configure
```bash
git clone <repo-url>
cd mindsync-ai
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your secrets
```

### 2. Run with Docker
```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1
- Database: localhost:5432

### 3. Manual Setup (Alternative)

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

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

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
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
