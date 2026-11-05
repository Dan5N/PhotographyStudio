# Project Status

Updated: 2026-11-06

## Delivery Target

Local, staff-only single-studio coursework demonstration. Manager login is intentionally `admin / 123456`, as requested. No public exposure or real personal data. External file transfer is manual, not performed by the application.

## Accepted Release

- Branding is consistently Photography Studio: browser title/description, package identity, icon metadata and camera favicon. Production login/main title assertions and all 4 non-writing browser checks passed after the branding update; demo data and credentials were unchanged.
- Formal project `photography-studio` runs the accepted release. App and PostgreSQL are healthy; `/api/ready` returns ready. Existing named volumes and `DEMO-001` were retained without a destructive volume reset. The documented default URL is `http://localhost:3000`.
- Demo-only cleanup completed on 2026-11-06: 4 seeded staff, Alex Chen, Portrait Session and `DEMO-001` at CREATED remain. Removed integration accounts and related test business/workflow/asset/audit records. All 4 non-writing browser checks passed afterwards. Paired backups are retained privately outside the repository. Isolated acceptance containers, data volumes, networks and obsolete test images have been removed; historical recovery evidence remains in private archives.
- Next.js 16.4.5, React 19.0.9, NextAuth 4.24.15, Prisma 7.10.1 with PostgreSQL adapter, PostgreSQL 16, Node 24, pnpm 10.34.9. Native TypeScript 7.0.2 checks source; Next.js/ESLint use TypeScript 6.0.2 compatibility API.
- Full lint: 0 errors, 36 warnings. Typecheck and 2 unit tests pass. Remaining warnings include legacy hook dependencies, unused code, private image previews and TanStack Table compiler compatibility.
- Final Linux production build passed. Both migrations applied to a new isolated database; workflow integration passed. The earlier local integration failure was an unreachable database, not a confirmed schema defect.
- Final isolated candidate passed 6 HTTP/browser checks: assigned upload/revision/approval/exact delivery; existing-file baseline; manager records/staff dialog; anonymous file denial; anonymous upload denial; invalid-origin denial.
- Consistent candidate backup contained 6 real asset files. Restoration into separate fresh PostgreSQL/asset volumes passed 5 checks, including unchanged delivery version linkage and exact approved JPEG bytes. All 6 asset SHA-256 hashes matched. App/database restart passed the existing-file check.
- Performance: 100 orders/500 real PNG records, five distinct reception sessions, 5 warmup iterations/session, then 200 list and 200 detail requests. List p95 24 ms, detail p95 25 ms; maximum 29 ms for both; no failed requests. Results are environment-specific; host configuration is intentionally not published. Not a constrained 4-core/8-GB certification.
- Formal post-cutover suite: 4 passed; 3 isolated lifecycle/persistence/performance checks intentionally skipped. Desktop/mobile screenshots are in `test-results/`.
- Pre-cutover formal database/asset archives are retained privately outside the repository. Formal assets were empty; non-empty recovery evidence comes from the isolated candidate. Backup locations and checksums are not published.
- Accepted tags: `photography-studio-app:accepted-20261106` and `photography-studio-migrate:accepted-20261106`. The original formal image was already absent from the image store, so exact old-binary rollback was not preserved. Data backups remain available.

## Remaining Boundaries

- Second-computer reproduction, HTTPS/reverse-proxy acceptance and resource-constrained performance require external validation. Same-host reproduction does not prove those gates.
- Original requirement documents are currently absent from the workspace. Earlier review is recorded in session history, but complete current FR/NFR line-by-line certification cannot be independently reconstructed. The delivery guide maps tested behavior by family without inventing missing identifiers.
- Assigned workflow/file access and order filtering are tested. Fine-grained field minimization within assigned order detail is not certified: the shared detail query includes customer, photos and tasks. A privacy review is required before real-data use.
- PostgreSQL adapter emits a concurrent-query deprecation warning in integration; future pg 9 compatibility needs review. Legacy React 19 peer warnings/template routes remain; unrelated routes are not fully accepted.
- Public deployment hardening, complete dependency audit, crash/disk-full fault injection, orphan-file maintenance and exhaustive cancellation/reassignment/browser cases remain outside local acceptance. Windows standalone build was not reverified; Linux Docker passed.
- Staff/admin instructions and measured evidence: [DELIVERY.md](DELIVERY.md). Actual contributor names/claims require team input and are not fabricated.

The local release is deployed; its core workflow, tested security boundaries, restart persistence, non-empty recovery and bounded HTTP performance are verified. This is not a claim that every SRS requirement or public-production gate passes.