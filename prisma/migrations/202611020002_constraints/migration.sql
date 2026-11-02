CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT "appointment_valid_interval" CHECK ("startsAt" < "endsAt");
ALTER TABLE "Appointment" ADD CONSTRAINT "photographer_no_overlap"
  EXCLUDE USING gist ("photographerId" WITH =, tstzrange("startsAt", "endsAt", '[)') WITH &&)
  WHERE (status <> 'CANCELLED');
CREATE UNIQUE INDEX "one_unresolved_revision" ON "RevisionRequest" ("taskId") WHERE "resolvedAt" IS NULL;
ALTER TABLE "Package" ADD CONSTRAINT "package_valid_limits" CHECK (price >= 0 AND "retouchLimit" > 0 AND "revisionLimit" >= 0);
ALTER TABLE "StudioOrder" ADD CONSTRAINT "order_valid_limits" CHECK (price >= 0 AND "retouchLimit" > 0 AND "revisionLimit" >= 0);
ALTER TABLE "StoredAsset" ADD CONSTRAINT "asset_valid_size" CHECK (size > 0 AND size <= 5242880);
ALTER TABLE "PhotoVersion" ADD CONSTRAINT "version_positive" CHECK (number > 0);
CREATE UNIQUE INDEX "User_username_key" ON "User" (username);