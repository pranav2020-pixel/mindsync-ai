# 🚀 Production Cloud Deployment Guide (Vercel + Render / Supabase)

MindSync AI consists of two parts:
1. **Frontend (Next.js 14)**: Deployed permanently on **Vercel** (Free global CDN).
2. **Backend (Node.js/Express) + Database (PostgreSQL)**: Deployed on **Render** (Free 1-Click Blueprint), **Railway**, or **Supabase**.

---

## ⚡ Quick 2-Step Deployment Process

### Step 1: Deploy Backend & Database (5 Minutes)

You have a `render.yaml` blueprint file already configured in this repository.

1. Create a free account at **[render.com](https://render.com)**.
2. Connect your GitHub account and click **New +** -> **Blueprint**.
3. Select your `mindsync-ai` repository.
4. Render will automatically read `render.yaml` and create:
   - A free managed **PostgreSQL** database (`mindsync-postgres`).
   - A free **Node.js Web Service** (`mindsync-backend`).
   - Automatically runs `prisma db push` and `prisma db seed` to populate clinical assessments and demo data!
5. Once deployment completes, copy your **Backend Service URL** (e.g. `https://mindsync-backend-xxxx.onrender.com`).

---

### Step 2: Deploy Frontend to Vercel (2 Minutes)

1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Select your `mindsync-ai` repository.
4. In the Project Configuration:
   - **Root Directory**: Click **Edit** and choose `frontend`.
   - **Framework Preset**: Next.js (detected automatically).
5. Open **Environment Variables** and add:
   ```env
   BACKEND_URL = https://your-backend-url.onrender.com
   NEXT_PUBLIC_BACKEND_URL = https://your-backend-url.onrender.com
   ```
6. Click **Deploy**!

In ~60 seconds, your site will be live at `https://mindsync-ai-yourname.vercel.app` with 99.9% global uptime!

---

### Step 3: Connect Frontend URL to Backend

In your **Render** dashboard under `mindsync-backend` -> **Environment**:
Update `FRONTEND_URL` to your actual Vercel domain (e.g. `https://mindsync-ai-yourname.vercel.app`).
