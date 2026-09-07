# IPL Nexus — Production Deployment & Operations Guide

This guide provides end-to-end instructions for deploying the **IPL Nexus** decision intelligence platform across local containers and major cloud platforms.

---

## 🏗️ Architecture & Port Mapping

```
                                  ┌───────────────────────────────┐
                                  │      Client Web Browser       │
                                  └──────────────┬────────────────┘
                                                 │
                                                 │ HTTP Requests
                                                 ▼
               ┌───────────────────────────────────────────────────────────────────┐
               │                         Docker Network                            │
               │                                                                   │
               │   ┌─────────────────────────┐     Reverse Proxy    ┌──────────┐   │
               │   │    ipl-nexus-frontend   │ ───────────────────► │ backend  │   │
               │   │      (Port 5173 / 80)   │      /api/*          │ (Port    │   │
               │   │      Alpine + Nginx     │                      │   8000)  │   │
               │   └─────────────────────────┘                      └────┬─────┘   │
               │                                                         │         │
               │                                                         ▼         │
               │                                               ┌────────────────┐  │
               │                                               │ DuckDB OLAP &  │  │
               │                                               │ Joblib Model   │  │
               │                                               └────────────────┘  │
               └───────────────────────────────────────────────────────────────────┘
```

| Service | Technology | Internal Port | Exposed Port | Purpose | Health Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Nginx | `80` | `5173` / `3000` | Static SPA + Reverse Proxy | `GET /healthz` |
| **Backend** | FastAPI + Uvicorn | `8000` | `8000` | DuckDB OLAP + ML Inference | `GET /api/health` |

---

## 🐳 Option 1: Local Deployment with Docker Compose (Recommended)

### Prerequisites
- **Docker Engine** 24+ or **Docker Desktop**
- **Docker Compose** v2+

### 1. Build and Launch Stack
```bash
# Clone repository
git clone https://github.com/vasudev1876961/IPL-NEXES.git
cd IPL-NEXES

# Build images and start containers in detached mode
docker compose up --build -d
```

### 2. Verify Container Health
```bash
docker compose ps
```
Both `ipl-nexus-backend` and `ipl-nexus-frontend` will report status `Up (healthy)`.

### 3. Access Application
- **Frontend Dashboard**: Open [http://localhost:5173](http://localhost:5173) or [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: Open [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 4. Inspect Logs & Shutdown
```bash
# View aggregated real-time logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Gracefully stop containers
docker compose down
```

---

## ☁️ Option 2: 1-Click Deployment on Render

IPL Nexus includes a declarative `render.yaml` Infrastructure-as-Code blueprint.

### Deployment Steps:
1. Fork or push your code to GitHub: `https://github.com/vasudev1876961/IPL-NEXES`.
2. Navigate to [Render Dashboard](https://dashboard.render.com).
3. Click **"New +"** ➔ Select **"Blueprint"**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and configure:
   - `ipl-nexus-backend`: Docker Web Service running FastAPI with `/api/health` probe.
   - `ipl-nexus-frontend`: Static Site automatically pointed to the backend host.
6. Click **"Apply"**. Render will build the Docker container and deploy both services.

---

## 🚂 Option 3: Deploy on Railway / Fly.io

### Railway
1. Install Railway CLI or connect via GitHub on [railway.app](https://railway.app).
2. Run in project root: `railway up`
3. Set environment variables on the backend service:
   - `PORT=8000`
   - `ENVIRONMENT=production`
4. Deploy frontend with `VITE_API_BASE_URL=https://<your-backend>.railway.app/api`.

### Fly.io
```bash
# Launch backend
fly launch --dockerfile Dockerfile.backend --name ipl-nexus-backend
fly deploy

# Launch frontend static proxy
cd frontend
fly launch --dockerfile Dockerfile --name ipl-nexus-frontend
fly deploy
```

---

## 🏢 Option 4: AWS (ECS Fargate or EC2)

### Deploying with AWS Elastic Container Service (ECS):
1. **Push images to Amazon ECR**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com

   docker build -t ipl-nexus-backend -f Dockerfile.backend .
   docker tag ipl-nexus-backend:latest <account_id>.dkr.ecr.us-east-1.amazonaws.com/ipl-nexus-backend:latest
   docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/ipl-nexus-backend:latest

   docker build -t ipl-nexus-frontend -f frontend/Dockerfile ./frontend
   docker tag ipl-nexus-frontend:latest <account_id>.dkr.ecr.us-east-1.amazonaws.com/ipl-nexus-frontend:latest
   docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/ipl-nexus-frontend:latest
   ```
2. **Create ECS Task Definition** referencing both containers with `awsvpc` network mode.
3. Configure **Application Load Balancer (ALB)** with target groups:
   - Path `/api/*` ➔ Backend Target Group (port 8000, health check `/api/health`)
   - Path `/*` ➔ Frontend Target Group (port 80, health check `/healthz`)

---

## ⚡ Option 5: Split Deployment (Vercel Frontend + Render/Railway Backend)

If you prefer hosting the React frontend on **Vercel** and the Python backend on **Render**:
1. Deploy Backend on Render using `Dockerfile.backend` (yielding e.g. `https://ipl-nexus-api.onrender.com`).
2. Deploy Frontend on Vercel:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_BASE_URL=https://ipl-nexus-api.onrender.com/api`

---

## 🔒 Production Security & Performance Best Practices

1. **Non-Root Container Execution**: `Dockerfile.backend` executes under `appuser` (UID 1000) for defense-in-depth isolation.
2. **Columnar Database Cache**: `ipl_nexus.duckdb` is read-only in query serving mode, maximizing concurrency without write locks.
3. **HTTP Gzip Compression**: Enabled in `nginx.conf` for all JSON payloads, SVG graphics, CSS, and JS bundles.
4. **CORS Restrictions**: In production, restrict `allow_origins` in `backend/app/main.py` from `["*"]` to your exact production domain.
5. **Asset Immutability**: Vite build hashes (`index-[hash].js`, `index-[hash].css`) are cached with `max-age=31536000, immutable` headers for optimal CDN performance.
