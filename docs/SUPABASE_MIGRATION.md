# Supabase delivery demo: migration status

Verified 2026-11-12. Project: ctedsdavjozclhdideby (delivery-pos-demo).

- All 53 repository migrations are recorded as completed in public._prisma_migrations; no failed records.
- 93 public tables including the Prisma history table. RLS enabled on all; no anon/authenticated table grants. The application uses a trusted NestJS backend, not browser access to business tables via the Supabase Data API. No permissive RLS policies were added.
- All 53 migration checksums match canonical LF repository contents, as used by Linux deploys. Initial Windows CRLF checksums were normalized in the Prisma history after verifying the equivalent SQL.
- The legacy StaffRoleName type is retained after roles.name becomes TEXT. Its migration file was updated in this branch to match the applied baseline.
- The read-permissions migration's legacy WAITER grant deletion was skipped only after verifying zero roles and zero role grants existed. The migration's INSERTs were applied; the resulting state is equivalent. This is noted in the Prisma migration log.
- Fixed search_path to public, pg_temp on the six application functions; public/anon/authenticated execute privileges were revoked. Sync remains disabled.
- Foreign/check constraints are validated. A permissions INSERT inside a transaction succeeded; ROLLBACK was verified to leave zero test rows.
- Security advisor now reports only INFO notices for RLS enabled without policies, intentional for backend-only access. No WARN/ERROR notices remained at the time of verification.

This verifies database structure and privileged SQL access only. It does not verify a running backend, Render DATABASE_URL, application login, sales, payments, or Cloudflare deployment. The dependency lockfile/build issue remains a separate pending task.

Do not rerun SQL files manually. The backend uses prisma migrate deploy against its configured DATABASE_URL. Use this branch (including the retained enum change), not the unchanged upstream migration file. Do not commit database passwords or connection strings.
