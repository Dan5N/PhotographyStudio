# Photography Studio

Coursework project for **Software Design and Architecture**.

A private, staff-only photography studio workflow for customer records, orders, shoots, photo selection, retouching and delivery. The application uses Next.js, tRPC, Prisma and PostgreSQL. It does not provide customer accounts, online payments, external messaging or automatic photo editing.

## Docker deployment

Requirements: Docker Engine/Desktop with the Compose plugin.

Create a `.env` file in the repository root:

```dotenv
POSTGRES_PASSWORD=replace-with-a-long-random-database-password
DEMO_PASSWORD=replace-with-a-strong-initial-manager-password
NEXTAUTH_SECRET=replace-with-at-least-32-random-bytes
NEXTAUTH_URL=http://localhost:3000
APP_PORT=3000
APP_CURRENCY=CNY
APP_TIMEZONE=Asia/Shanghai
```

Generate a secret with `openssl rand -base64 32`, or use a trusted password manager. Keep `.env` private and do not commit it.

Start the application:

```sh
docker compose up -d --build --wait
```

To reproduce the installation on another computer, copy the project source (including `Dockerfile`, `docker-compose.yml`, `prisma/migrations/` and `pnpm-lock.yaml`) to that computer, install Docker with the Compose plugin, create a new `.env` with fresh secrets as above, then run the same command. No Node.js or pnpm installation is needed on the target computer. Use a free `APP_PORT` if port 3000 is occupied. The first start builds the images, waits for PostgreSQL, applies migrations, seeds the manager and starts the app. Confirm with `docker compose ps`; `db` and `app` should be healthy and `migrate` should have exited successfully. The target computer needs network access to pull the base images and package dependencies during the initial build.

Open `http://localhost:3000`. The migration service applies database migrations and creates the initial studio data before the app starts. Sign in with the seeded `manager` account and the `DEMO_PASSWORD` value. Change the initial password before using this installation with real data.

Check service state and logs:

```sh
docker compose ps
docker compose logs -f app
```

The PostgreSQL database and uploaded private assets use named volumes (`postgres-data` and `assets`) and persist across container recreation. Back up both volumes before upgrades or maintenance. `docker compose down` preserves them; **do not use `docker compose down -v`** unless permanent data deletion is intended.

To stop the services while preserving data:

```sh
docker compose down
```

Set `NEXTAUTH_URL` to the externally reachable HTTPS URL when deploying behind a TLS-terminating reverse proxy. Restrict network access to the application and database, and never expose PostgreSQL directly to the public internet. This Compose setup does not configure TLS or automated backups.

## Local development

Install dependencies with `pnpm install`, configure `DATABASE_URL` and `NEXTAUTH_SECRET` in `.env`, then run migrations and seed data:

```sh
pnpm exec prisma migrate deploy
pnpm db:seed:studio
pnpm dev
```

Useful checks:

```sh
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

The integration tests require a reachable PostgreSQL database. Browser tests require `DEMO_PASSWORD` to match the seeded manager account; set `TEST_BASE_URL` to test a running deployment instead of the local development server. The current automated suite covers core workflow state transitions, concurrency and permission boundaries, image validation, login, customer listing and rejection of anonymous/cross-origin uploads; it does not yet cover a successful authenticated file upload/download lifecycle end to end.

## Scope and status

See [`doc/PROJECT_STATUS.md`](doc/PROJECT_STATUS.md) for verified coverage, outstanding SRS requirements and known limitations. The current production Docker and browser checks are smoke tests, not a complete production-readiness certification.