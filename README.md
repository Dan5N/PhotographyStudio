# Photography Studio

Coursework project for **Software Design and Architecture**.

Official repository: [Dan5N/PhotographyStudio](https://github.com/Dan5N/PhotographyStudio).

A private, staff-only photography studio workflow for customer records, orders, shoots, photo selection, retouching and delivery. The application uses Next.js, tRPC, Prisma and PostgreSQL. It does not provide customer accounts, online payments, external messaging or automatic photo editing.

## Docker deployment

Requirements: Docker Engine/Desktop with the Compose plugin.

Copy `docker-compose-example.yml` to `docker-compose.yml` before the first start. The local Compose file is ignored by Git.

The default Compose project name is `photography-studio`, producing containers `photography-studio-app-1`, `photography-studio-db-1` and the one-shot `photography-studio-migrate-1`. A fresh database includes four staff accounts, customer Alex Chen, the Portrait Session package and order `DEMO-001`. Repeated initialization preserves existing business records without duplicating this mock data. The demo order starts at CREATED; image uploads, retouching and delivery are not pre-populated.

Create a `.env` file in the repository root:

```dotenv
POSTGRES_PASSWORD=replace-with-a-long-random-database-password
DEMO_PASSWORD=replace-with-a-strong-initial-staff-password
NEXTAUTH_SECRET=replace-with-at-least-32-random-bytes
NEXTAUTH_URL=http://localhost:3000
APP_PORT=3000
APP_CURRENCY=CNY
APP_TIMEZONE=Asia/Shanghai
# Optional when the official npm registry is unreachable:
# NPM_REGISTRY=https://registry.npmmirror.com
```

Generate a secret with `openssl rand -base64 32`, or use a trusted password manager. Keep `.env` private and do not commit it.

Before upgrading an existing installation, stop the app to pause writes, but keep PostgreSQL running for `pg_dump`. Save a PostgreSQL custom-format dump and an archive of the `assets` volume outside Docker-managed storage. Verify both archives before starting a migration. Keep the dump and volume archive together; restoring only the database or only the asset files is insufficient. See [the delivery guide](doc/DELIVERY.md) for tested backup and recovery steps.

Start the application:

```sh
docker compose up -d --build --wait
```

To reproduce the installation on another computer, copy the project source (including `Dockerfile`, `docker-compose.yml`, `prisma/migrations/` and `pnpm-lock.yaml`) to that computer, install Docker with the Compose plugin, create a new `.env` with fresh secrets as above, then run the same command. No Node.js or pnpm installation is needed on the target computer. Use a free `APP_PORT` if port 3000 is occupied. The first start builds the images, waits for PostgreSQL, applies migrations, seeds the manager and starts the app. Confirm with `docker compose ps`; `db` and `app` should be healthy and `migrate` should have exited successfully. The target computer needs network access to pull the base images and package dependencies during the initial build.

Open `http://localhost:3000`. The migration service applies database migrations and creates initial studio data before the app starts. For local coursework demonstrations, sign in as `admin` with password `123456`. Each seed run resets this administrator credential. `DEMO_PASSWORD` for other demonstration staff must contain at least 12 characters. This fixed credential is limited to local demonstrations and must not be exposed publicly or used with real data.

Check service state and logs:

```sh
docker compose ps
docker compose logs -f app
```

The PostgreSQL database and uploaded private assets use named volumes (`postgres-data` and `assets`) and persist across container recreation. `docker compose down` preserves them; **do not use `docker compose down -v`** unless permanent data deletion is intended.

To stop the services while preserving data:

```sh
docker compose down
```

Set `NEXTAUTH_URL` to the externally reachable HTTPS URL when deploying behind a TLS-terminating reverse proxy. Restrict network access to the application and database, and never expose PostgreSQL directly to the public internet. This Compose setup does not configure TLS or automated backups.

## Local development

Use Node.js 24 LTS and pnpm 10.34.9 (the version pinned in `package.json`). Install dependencies with `pnpm install`, configure `DATABASE_URL` and `NEXTAUTH_SECRET` in `.env`, then run migrations and seed data:

The migration targets Next.js 16.4.5 and Prisma 7.10.1. `pnpm typecheck` uses the native TypeScript 7.0.2 compiler; Next.js and ESLint use the TypeScript 6.0.2 compatibility API because their tooling still needs the JavaScript compiler API. Production builds explicitly use Webpack. Prisma uses the PostgreSQL driver adapter and retains the compatible `prisma-client-js` generator with an explicit output directory; migration history is unchanged.

```sh
pnpm exec prisma migrate deploy
pnpm db:seed:studio
pnpm dev
```

Useful checks:

```sh
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

Integration tests create records and require a separate PostgreSQL database with the current migrations applied. Never run them against the formal database. Browser tests use the local coursework credential `admin / 123456`; set `TEST_BASE_URL` to test a running deployment. Four default checks cover sign-in, real customer/package/order records, staff-account dialog and HTTP rejection boundaries.

Only on a disposable isolated deployment, set `STUDIO_LIFECYCLE_TEST=1` for the successful JPEG/PNG upload, revision, approval, exact delivery and permission lifecycle. Set `STUDIO_PERSISTENCE_TEST=1` after that lifecycle to verify its existing approved image after restart/restore. Set `STUDIO_PERFORMANCE_TEST=1` to create 100 orders/500 images and measure five concurrent authenticated sessions. These three checks are skipped by default to avoid polluting formal data. See [the delivery guide](doc/DELIVERY.md) for measured results and limitations.

## Scope and status

If the official npm registry is unreachable during Docker builds, select an accessible registry without changing the lockfile:

```sh
docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com app migrate
docker compose up -d --wait
```

See [doc/PROJECT_STATUS.md](doc/PROJECT_STATUS.md) for acceptance and limitations, and [doc/DELIVERY.md](doc/DELIVERY.md) for staff/admin operations and evidence. The accepted release is running at `http://localhost:3000`. This is a local coursework delivery, not a public-production security certification.