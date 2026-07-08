# ShopSphere — E-Commerce Microservices CI/CD Project

A small full-stack e-commerce application (product catalog, auth, cart) built
as two independently deployable microservices, with a complete CI/CD pipeline
that lints, tests, security-scans, builds Docker images, pushes them to
Docker Hub, and deploys automatically on every push to `main`.

This project is intentionally scoped to be **buildable and demonstrable in a
weekend**, while still touching every skill DevOps job descriptions ask for:
Git workflows, Docker, automated testing, CI/CD, container security scanning,
and (optionally) Kubernetes.

---

## Architecture

```
                         ┌─────────────────────────┐
                         │   GitHub Actions CI/CD    │
                         │  lint → test → scan →     │
                         │  build → push → deploy    │
                         └────────────┬──────────────┘
                                      │
                                      ▼
        ┌───────────────────────────────────────────────────┐
        │                     Docker Hub                     │
        │   shopsphere-backend:latest  shopsphere-frontend:latest │
        └───────────────────────────┬─────────────────────────┘
                                      │ docker compose pull / kubectl apply
                                      ▼
   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
   │   frontend     │  /api  │    backend     │         │    MongoDB     │
   │ React + Nginx  │ ─────► │ Node/Express   │ ──────► │  (products,    │
   │   port 80      │        │   port 5000    │         │  users, cart)  │
   └───────────────┘         └───────────────┘         └───────────────┘
```

## Tech Stack

| Layer            | Technology                                      |
|-------------------|--------------------------------------------------|
| Frontend          | React 18, Vite, React Router, Axios              |
| Backend           | Node.js 20, Express, Mongoose, JWT auth           |
| Database          | MongoDB 7                                        |
| Testing           | Jest, Supertest, mongodb-memory-server            |
| Containerization  | Docker (multi-stage builds), Docker Compose       |
| CI/CD             | GitHub Actions                                    |
| Security scanning | Trivy (filesystem + image scan)                   |
| Orchestration     | Kubernetes manifests (Deployment/Service/Secret)  |
| Monitoring hook   | `/metrics` endpoint (Prometheus client) built in  |

## Repository Structure

```
ecommerce-cicd/
├── backend/                  # Node/Express API microservice
│   ├── src/
│   │   ├── routes/           # products, auth, cart
│   │   ├── models/           # Mongoose schemas
│   │   ├── middleware/       # JWT auth guard
│   │   ├── config/           # DB connection
│   │   ├── app.js            # express app (testable, no listen())
│   │   └── server.js         # entrypoint
│   ├── tests/                # Jest + Supertest integration tests
│   ├── scripts/seed.js       # sample product seeder
│   ├── Dockerfile            # multi-stage, non-root user, healthcheck
│   └── package.json
├── frontend/                  # React SPA microservice
│   ├── src/
│   │   ├── pages/            # ProductList, Cart, Login, Register
│   │   ├── components/       # ProductCard
│   │   └── api.js            # axios client w/ JWT interceptor
│   ├── Dockerfile            # build stage (Vite) + serve stage (nginx)
│   ├── nginx.conf            # SPA routing + /api reverse proxy
│   └── package.json
├── k8s/                       # Kubernetes manifests (optional deploy target)
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── mongo-and-secrets.yaml
├── .github/workflows/ci-cd.yml  # the full pipeline
├── docker-compose.yml          # local / single-VM orchestration
└── README.md
```

---

## Part A — Run It Locally (fastest way to see it working)

**Prerequisites:** Docker Desktop (or Docker Engine + Compose plugin) installed.

```bash
git clone <your-fork-url> shopsphere-ecommerce
cd shopsphere-ecommerce

# Build and start all three services
docker compose up -d --build

# Confirm all containers are healthy
docker compose ps

# Seed some sample products into MongoDB
docker compose exec backend npm run seed
```

Open the app:
- Frontend: **http://localhost:8080**
- Backend health check: **http://localhost:5000/health**
- Backend metrics (Prometheus format): **http://localhost:5000/metrics**

Stop everything:
```bash
docker compose down          # keep the mongo volume (data persists)
docker compose down -v       # also wipe the mongo volume
```

---

## Part B — Run It Without Docker (pure Node, for active development)

```bash
# 1. Start MongoDB locally, or use Docker just for the DB:
docker run -d --name mongo -p 27017:27017 mongo:7

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run seed        # optional: adds sample products
npm run dev          # http://localhost:5000

# 3. Frontend (in a second terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Run the backend test suite and linter on their own:
```bash
cd backend
npm run lint
npm test
```

---

## Part C — Push This Project to Your Own GitHub Repo

```bash
cd shopsphere-ecommerce
git init
git add .
git commit -m "Initial commit: ShopSphere e-commerce CI/CD project"
git branch -M main
git remote add origin https://github.com/<your-username>/shopsphere-ecommerce.git
git push -u origin main
```

---

## Part D — Wire Up the CI/CD Pipeline (GitHub Actions)

The workflow at `.github/workflows/ci-cd.yml` runs automatically on every
push/PR to `main`. To let it push images to Docker Hub and deploy, configure
these in your GitHub repo:

**Settings → Secrets and variables → Actions → Variables**
| Name                 | Value                        |
|-----------------------|-------------------------------|
| `DOCKERHUB_USERNAME`  | your Docker Hub username      |

**Settings → Secrets and variables → Actions → Secrets**
| Name                | Value                                                        |
|----------------------|----------------------------------------------------------------|
| `DOCKERHUB_TOKEN`    | Docker Hub access token (Docker Hub → Account Settings → Security → New Access Token) |
| `SSH_HOST`           | Public IP/DNS of your deployment server (optional, only needed for the `deploy` job) |
| `SSH_USERNAME`       | SSH username on that server (e.g. `ubuntu`)                    |
| `SSH_PRIVATE_KEY`    | The private half of an SSH key pair whose public half is on the server |

If you don't have a deployment server yet, that's fine — the `deploy` job
will simply fail/skip while `backend-test`, `frontend-build`,
`security-scan`, and `build-and-push` still run and push working images to
Docker Hub. That alone is enough to demonstrate a working CI/CD pipeline.

Every push to `main` runs, in order:
1. **backend-test** — ESLint + Jest (unit/integration tests against an
   in-memory MongoDB, no external DB needed)
2. **frontend-build** — ESLint + Vite production build
3. **security-scan** — Trivy scans the repo filesystem for known CVEs
4. **build-and-push** — builds both Docker images and pushes
   `:latest` and `:<commit-sha>` tags to Docker Hub, then Trivy-scans the
   built image
5. **deploy** — SSHes into your server and re-deploys via `docker compose pull && up -d`

---

## Part E — Deploy to a Real Server (matches the `deploy` job above)

```bash
# On a fresh Ubuntu EC2 instance (or any VM):
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER   # log out/in after this

git clone https://github.com/<your-username>/shopsphere-ecommerce.git
cd shopsphere-ecommerce
docker compose up -d --build
```

Open Security Group / firewall ports **80** (frontend) and **5000** (backend,
optional if only accessed via the frontend's `/api` proxy).

From then on, every push to `main` re-deploys automatically via the
`deploy` job in the pipeline — no manual SSH needed.

---

## Part F — (Optional) Deploy to Kubernetes Instead

If you want to show Kubernetes on your resume too:

```bash
kubectl create secret generic shopsphere-secrets \
  --from-literal=mongo-uri='mongodb://mongo:27017/ecommerce' \
  --from-literal=jwt-secret='replace-with-a-long-random-string'

# Edit the <DOCKERHUB_USERNAME> placeholder in the two deployment YAMLs first
kubectl apply -f k8s/mongo-and-secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

kubectl get pods
kubectl get svc shopsphere-frontend   # grab the EXTERNAL-IP once it's a LoadBalancer
```

> Note: `mongo-and-secrets.yaml` uses `emptyDir` storage for simplicity, so
> data is lost if the Mongo pod restarts. For a production-realistic setup,
> swap it for a `PersistentVolumeClaim`.

---

## API Reference (quick)

| Method | Endpoint              | Auth required | Description            |
|--------|------------------------|:--------------:|--------------------------|
| GET    | `/health`, `/ready`   | No             | Liveness/readiness probes |
| GET    | `/metrics`            | No             | Prometheus metrics        |
| GET    | `/api/products`       | No             | List products (supports `?search=` and `?category=`) |
| POST   | `/api/products`       | No             | Create a product          |
| GET    | `/api/products/:id`   | No             | Get one product           |
| PUT    | `/api/products/:id`   | No             | Update a product           |
| DELETE | `/api/products/:id`   | No             | Delete a product           |
| POST   | `/api/auth/register`  | No             | Create account, returns JWT |
| POST   | `/api/auth/login`     | No             | Login, returns JWT         |
| GET    | `/api/cart`           | Yes            | View your cart             |
| POST   | `/api/cart`           | Yes            | Add item `{ productId, quantity }` |
| DELETE | `/api/cart/:productId`| Yes            | Remove item from cart      |

---

## Suggested Resume Bullet Points

- Designed and built a full-stack e-commerce application as two
  independently containerized microservices (React/Nginx frontend,
  Node/Express/MongoDB backend), cutting local environment setup from
  manual installs to a single `docker compose up` command.
- Implemented a 5-stage GitHub Actions CI/CD pipeline (lint → test →
  Trivy security scan → Docker build/push → automated SSH deployment),
  reducing manual release effort and catching lint/test failures before
  merge.
- Wrote 10+ Jest/Supertest integration tests covering auth, product CRUD,
  and cart operations using an in-memory MongoDB instance, enabling fast,
  isolated CI test runs with no external database dependency.
- Hardened Docker images with multi-stage builds, non-root users, and
  built-in health checks; integrated Trivy to scan both the filesystem
  and final images for CRITICAL/HIGH CVEs on every build.
- Authored Kubernetes manifests (Deployments, Services, Secrets) as an
  alternate deployment target, exposing the frontend via a LoadBalancer
  service and wiring readiness/liveness probes to the API's `/health`
  and `/ready` endpoints.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker compose up` fails on port 8080/5000/27017 already in use | Stop whatever else is using that port, or change the left-hand port number in `docker-compose.yml` |
| Frontend loads but products don't appear | Run `docker compose exec backend npm run seed` |
| `401 Unauthorized` on cart requests | You need to register/login first — the frontend stores the JWT in `localStorage` after login |
| GitHub Actions `build-and-push` fails with auth error | Double-check `DOCKERHUB_USERNAME` (variable) and `DOCKERHUB_TOKEN` (secret) are set correctly under repo Settings |
| `deploy` job fails | Expected if you haven't set up `SSH_HOST`/`SSH_USERNAME`/`SSH_PRIVATE_KEY` yet — the rest of the pipeline still runs fine without it |
