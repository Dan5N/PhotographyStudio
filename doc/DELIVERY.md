# Local Delivery Guide

Accepted: 2026-11-06. URL: `http://localhost:3000`. Manager: `admin / 123456`. Local coursework only; no real customer data or public exposure.

## Staff Workflow

1. Manager creates staff through **Staff accounts**, assigning RECEPTION, PHOTOGRAPHER or RETOUCHER. Seeded names are `reception`, `photographer`, `retoucher`; initial password comes from private `DEMO_PASSWORD`. Existing non-manager passwords are preserved by seeding.
2. Reception/manager saves a customer/package and creates an order with requirements and future deadline. The order snapshots package price and allowances. Search by number or customer.
3. Reception/manager schedules an active photographer. Overlap is rejected; adjacent appointments are allowed. Rescheduling requires a reason.
4. Assigned photographer uploads valid JPEG/PNG originals, at most 5 MiB each, and completes the shoot. Other staff cannot perform this assigned specialist action.
5. Reception/manager selects originals within the package limit and confirms with the customer's summary. Confirmation freezes selection and creates retouch tasks; late originals are rejected.
6. Reception/manager assigns an active retoucher/deadline. That retoucher starts and uploads versions. Reception/manager reviews the current submitted version, requests combined changes within the allowance, or approves. Sequential history is retained.
7. When all photos are approved, download the approved files and transfer them externally. Only after successful transfer, record channel/reference. Recording sent does not transmit files. Record acknowledgement after customer confirmation.
8. Manager reviews stage counts, overdue/staff work and audit events. Cancellation requires a reason and is limited to before selection confirmation.

For errors, check stage, role/assignment, dates, overlap and package limits. Sign in again if the session expired. Do not bypass validation by editing database rows. Private downloads require an active authorized session.

## Administration

Follow README for setup. Keep secrets private. Check `docker compose ps`, app logs and `/api/ready`. The migrate service must exit successfully before the app starts. Each seed resets local manager to `123456`; other existing credentials/business records are preserved.

`docker compose down` preserves named volumes. Never use `down -v` for routine stops. Back up database and assets together outside Docker-managed storage.

### Consistent Backup (PowerShell)

Use a new directory each time. Stop app writes, keep PostgreSQL running. Check each command before continuing; on backup failure, restart the app without migrating.

```powershell
$backup = $env:STUDIO_BACKUP_DIR
if (-not $backup) { throw 'Set STUDIO_BACKUP_DIR to a private directory outside the repository.' }
New-Item -ItemType Directory -Force $backup
docker compose stop app
docker exec photography-studio-db-1 pg_dump -U studio -d studio -Fc -f /tmp/studio.dump
docker cp photography-studio-db-1:/tmp/studio.dump "$backup\studio.dump"
docker run --rm --user root --entrypoint sh -v photography-studio_assets:/assets:ro -v "${backup}:/backup" photography-studio-app:accepted-20261106 -c 'tar -cf /backup/assets.tar -C /assets .'
docker exec photography-studio-db-1 pg_restore --list /tmp/studio.dump
Get-FileHash "$backup\studio.dump", "$backup\assets.tar" -Algorithm SHA256
docker compose start app
```

Record hashes securely with the pair. Do not pipe binary dumps through PowerShell text redirection. Archives contain private data and require access control.

### Isolated Restore

Set fresh process-local `POSTGRES_PASSWORD`, `DEMO_PASSWORD` (12+ characters), `NEXTAUTH_SECRET`, `APP_PORT=3300`, `NEXTAUTH_URL=http://localhost:3300`. Never overwrite formal secrets. Use a new project name, free port and empty volumes; do not reuse formal volumes.

```powershell
docker tag photography-studio-app:accepted-20261106 studio-recovery-app:latest
docker tag photography-studio-migrate:accepted-20261106 studio-recovery-migrate:latest
docker compose -p studio-recovery -f docker-compose-example.yml up -d --no-build --wait db
docker cp "$backup\studio.dump" studio-recovery-db-1:/tmp/studio.dump
docker exec studio-recovery-db-1 pg_restore -U studio -d studio --exit-on-error /tmp/studio.dump
docker volume create --label com.docker.compose.project=studio-recovery --label com.docker.compose.volume=assets studio-recovery_assets
docker run --rm --user root --entrypoint sh -v studio-recovery_assets:/assets -v "${backup}:/backup:ro" photography-studio-app:accepted-20261106 -c 'tar -xf /backup/assets.tar -C /assets && chown -R node:node /assets'
docker compose -p studio-recovery -f docker-compose-example.yml up -d --no-build --wait
```

Verify readiness, original orders, approved delivery links and existing file hashes/downloads. Creating a new order does not prove old records survived. Restore process-local overrides afterwards. Preserve accepted tags; `docker save`/`docker load` supports offline image handover.

Release archives and their checksum manifests are retained privately outside the repository. Host paths, configuration and backup manifests are not part of the public release.

Formal assets were empty. The candidate pair contained 6 images and was restored into fresh volumes. Original formal image retention failed because it was already unavailable; exact prior-binary rollback is not claimed. For future updates, retain accepted tags and paired backups before replacing images; test schema compatibility separately.

## Verification Record

| Family | Evidence | Result |
| --- | --- | --- |
| ORD / SCH | Real demo records; overlap race, adjacent schedules, failed-reschedule rollback, pre-selection cancellation integration | Tested cases pass |
| PHO / RET | Real upload, exact bytes, selection freeze, outsider denial, revisions 1/2 and approval | Pass |
| DEL | Approved manifest, manual-send record, acknowledgement, unauthorized download rejection | Pass |
| FR-DEL-06 reports | Database stage/overdue/staff aggregates; exhaustive report assertions not added | Partial verification |
| Security | Anonymous 401, invalid origin 403, assigned file access; password/image unit tests | Tested boundaries pass |
| Recovery | Paired backup, fresh restore, 6 matching hashes, existing approved JPEG byte equality, restart | Pass |
| Performance | 100 orders/500 PNG rows, 5 reception sessions, 5 warmups/session, 40 measured iterations/session | Pass on actual host |
| Documentation | Setup, staff/admin guide, actual results; team contributions and full original matrix unavailable | Partial |
| Portability / HTTPS | Same-host fresh Docker install; no second host/TLS run | External gates pending |

Static: lint 0 errors/36 warnings, typecheck pass, unit 2/2, integration 1/1, Linux production build pass. Candidate HTTP/browser 6/6 before the optional performance case was added. Restored suite 5 passed/1 intentionally skipped. Formal suite 4 passed/3 intentionally skipped. Dedicated performance and post-restart checks each passed.

Performance: list 200 requests, p95 24 ms/max 29 ms; detail 200, p95 25 ms/max 29 ms; no failures. Closed-loop five-session run, no think time, excluding fixture creation and binary transfer. Host settings are intentionally omitted; results are environment-specific. Not a sustained capacity or constrained 4-core/8-GB claim.

Screenshots: `test-results/studio-desktop.png`, `test-results/studio-mobile.png`. Optional test switches are in README. Remaining privacy/dependency/fault-injection limitations are in PROJECT_STATUS.md. Team members must provide their actual names and contributions; none are invented.