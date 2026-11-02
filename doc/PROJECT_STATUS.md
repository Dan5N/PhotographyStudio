# Project Status

Updated: 2026-11-02

## Target

Implement all Must requirements in Photography_Studio_SRS.md and the FR-DEL-06 reports. Deliver a tested, Docker-deployable single-studio internal workflow. No customer portal, payment, messaging, or automatic editing.

## Verified

- Read both Markdown requirement documents in full.
- Confirmed manager may perform reception decisions, but only assigned photographers/retouchers may perform their specialist actions.
- Defaults: CNY, Asia/Shanghai; fresh database, no legacy data migration.
- Host tools: Node 24.15.0, pnpm 8.13.1, Docker 29.7.2, Compose 5.5.1.
- Repository is a source snapshot without Git metadata, installed dependencies, or environment configuration.
- Corrected Prisma provider to postgresql.
- Added initial customer/package/order/shoot/photo/selection/task/version/revision/delivery/audit schema.
- Prisma 5.22.0 schema validation and client generation passed.
- PostgreSQL 16 applied both migrations; the studio seed ran twice without overwriting existing records.
- Unit tests pass for salted password verification and JPEG/PNG content validation (2 tests).
- PostgreSQL workflow integration passes for scheduling races (serialized with a photographer-scoped transaction lock), order locking, selection idempotency/freeze, assignment and role boundaries, revisions, approvals, delivery manifests and acknowledgement.
- TypeScript typecheck passes.
- Playwright production Docker checks pass for manager sign-in/customer listing, anonymous private-file rejection, anonymous upload rejection (401) and authenticated cross-origin upload rejection (403); desktop/mobile screenshots are generated under `test-results/`.
- A clean, new Compose project and fresh named volumes build successfully; PostgreSQL health, migration/seed completion and app `/api/ready` health checks pass. Production browser checks pass against the clean deployment.
- The order detail API now filters photographer and retoucher access by assignment, matching the order-list scope.

## In Progress

- Complete successful authenticated upload/version submission and authorized/unauthorized file retrieval lifecycle tests.

## Not Yet Implemented or Verified

- Successful upload lifecycle, assigned/unassigned staff access to real image records, revision submission and authorized download are not yet verified end to end through HTTP.
- Operational backup/restore and performance measurement (100 orders/500 photo-version rows, five concurrent users); admin/staff guides and requirement-linked verification records.
- Second-computer reproducibility and production HTTPS/reverse-proxy validation.

## Known Gaps

- The original template includes unrelated editor/demo routes; the legacy rich-text editor now uses client-only loading to avoid the Node 22 server-rendering failure. Other unrelated template routes still need route-level acceptance.
- Next.js 15.1.3 and several template dependencies are old; review and apply security updates before exposing the service beyond a trusted local network.
- The current integration suite exercises domain services but does not yet cover the full HTTP upload lifecycle.
- The Windows standalone build cannot create pnpm symlinks under this host's current permissions; Linux Docker image builds succeed instead.

Core business workflow integration tests and a clean Docker reproduction pass. Production browser smoke tests cover sign-in, customer listing and several HTTP security rejections. The successful image lifecycle and remaining nonfunctional acceptance criteria are still outstanding; this is not a claim of complete SRS acceptance or production readiness.