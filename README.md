# PingTest

Full-stack Ping Test web application built with **Express** + **TypeScript** backend and **React + Vite + TailwindCSS** frontend. The backend performs real ICMP pings and DNS resolution; the frontend provides an interactive dashboard with single and continuous ping modes.

## Features
- Single ping test (4 packets, 1s timeout)
- Continuous ping mode (1 ping/sec up to 60s) with live chart and summary
- DNS resolution (A, AAAA, CNAME)
- Latency stats, jitter, packet loss, TTL, individual times
- Dark/light mode and local history of last 10 hosts
- Clickable host examples and validation to block private/localhost targets
- Dockerfiles for frontend and backend plus `docker-compose.yml`
- Ready for GCP Cloud Run deployment

## Project Structure
```
backend/    Express + TypeScript API
frontend/   Vite + React + Tailwind UI
```

## Prerequisites
- Node.js 18+
- Docker (optional but recommended)

## Local Development
### Backend
```bash
cd backend
npm install
npm run dev
```
API runs on `http://localhost:8080` with endpoints:
- `GET /ping?host=example.com`
- `GET /ping/continuous?host=example.com&duration=60`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Set `VITE_API_BASE` in `.env` if the backend is not on `http://localhost:8080`.

## Docker
Build and run both services together:
```bash
docker-compose up --build
```
Frontend will be available at `http://localhost:5173`, backend at `http://localhost:8080`.

### Backend Image (Cloud Run)
```bash
cd backend
docker build -t gcr.io/PROJECT_ID/pingtest-backend .
docker push gcr.io/PROJECT_ID/pingtest-backend
gcloud run deploy pingtest-backend --image gcr.io/PROJECT_ID/pingtest-backend --platform managed --allow-unauthenticated --port 8080
```

### Frontend Image (Cloud Run)
```bash
cd frontend
docker build -t gcr.io/PROJECT_ID/pingtest-frontend .
docker push gcr.io/PROJECT_ID/pingtest-frontend
gcloud run deploy pingtest-frontend --image gcr.io/PROJECT_ID/pingtest-frontend --platform managed --allow-unauthenticated --port 4173 --set-env-vars VITE_API_BASE=https://<BACKEND_URL>
```

## Continuous Ping Implementation
- Backend issues one `ping -c 1 -W 1` per second for up to 60 seconds.
- Collects per-second latency/TTL timeline plus summary stats (packet loss, min/avg/max, jitter).
- Frontend renders the running series in a live line chart with status indicator and elapsed timer.

## Testing
Backend unit tests cover the ping output parser and DNS resolver:
```bash
cd backend
npm test
```

## Security Considerations
- Input validation blocks empty, malformed, localhost, and private IP targets.
- Backend executes the OS `ping` binary with conservative timeouts.
- CORS is enabled for the frontend domain.
