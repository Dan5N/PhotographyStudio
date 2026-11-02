-- CreateEnum
CREATE TYPE "OrderStage" AS ENUM ('CREATED', 'SCHEDULED', 'AWAITING_SELECTION', 'RETOUCHING', 'READY_FOR_DELIVERY', 'AWAITING_ACKNOWLEDGEMENT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShootStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "editable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "parent" TEXT,
    "order" INTEGER NOT NULL,
    "menuType" TEXT NOT NULL,
    "status" CHAR(1) NOT NULL,
    "editable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "remark" TEXT,
    "roleName" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" CHAR(1) NOT NULL,
    "editable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleMenu" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,

    CONSTRAINT "RoleMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "retouchLimit" INTEGER NOT NULL,
    "revisionLimit" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioOrder" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "retouchLimit" INTEGER NOT NULL,
    "revisionLimit" INTEGER NOT NULL,
    "requirements" TEXT NOT NULL,
    "deadline" TIMESTAMPTZ(3) NOT NULL,
    "stage" "OrderStage" NOT NULL DEFAULT 'CREATED',
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StudioOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "ShootStatus" NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredAsset" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Selection" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMPTZ(3),
    "confirmedBy" TEXT,
    "summary" TEXT,

    CONSTRAINT "Selection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectionItem" (
    "id" TEXT NOT NULL,
    "selectionId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,

    CONSTRAINT "SelectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetouchTask" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "deadline" TIMESTAMPTZ(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "approvedVersionId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMPTZ(3),
    "approvalSummary" TEXT,

    CONSTRAINT "RetouchTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoVersion" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "assetId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionRequest" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(3),
    "responseVersionId" TEXT,

    CONSTRAINT "RevisionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMPTZ(3),
    "acknowledgedBy" TEXT,
    "acknowledgementSummary" TEXT,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryItem" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,

    CONSTRAINT "DeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_fkey" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_fkey" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_key_key" ON "Menu"("key");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_roleKey_key" ON "Role"("roleKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudioOrder_number_key" ON "StudioOrder"("number");

-- CreateIndex
CREATE INDEX "StudioOrder_stage_deadline_idx" ON "StudioOrder"("stage", "deadline");

-- CreateIndex
CREATE INDEX "StudioOrder_customerId_idx" ON "StudioOrder"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_orderId_key" ON "Appointment"("orderId");

-- CreateIndex
CREATE INDEX "Appointment_photographerId_startsAt_idx" ON "Appointment"("photographerId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoredAsset_key_key" ON "StoredAsset"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_assetId_key" ON "Photo"("assetId");

-- CreateIndex
CREATE INDEX "Photo_orderId_idx" ON "Photo"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Selection_orderId_key" ON "Selection"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "SelectionItem_photoId_key" ON "SelectionItem"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "SelectionItem_selectionId_photoId_key" ON "SelectionItem"("selectionId", "photoId");

-- CreateIndex
CREATE UNIQUE INDEX "RetouchTask_photoId_key" ON "RetouchTask"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "RetouchTask_approvedVersionId_key" ON "RetouchTask"("approvedVersionId");

-- CreateIndex
CREATE INDEX "RetouchTask_assigneeId_status_idx" ON "RetouchTask"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "RetouchTask_orderId_idx" ON "RetouchTask"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoVersion_assetId_key" ON "PhotoVersion"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoVersion_taskId_number_key" ON "PhotoVersion"("taskId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "RevisionRequest_responseVersionId_key" ON "RevisionRequest"("responseVersionId");

-- CreateIndex
CREATE INDEX "RevisionRequest_taskId_idx" ON "RevisionRequest"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryItem_deliveryId_photoId_key" ON "DeliveryItem"("deliveryId", "photoId");

-- CreateIndex
CREATE INDEX "AuditEvent_targetId_createdAt_idx" ON "AuditEvent"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_relation" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_relation" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioOrder" ADD CONSTRAINT "StudioOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioOrder" ADD CONSTRAINT "StudioOrder_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StudioOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StudioOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "StoredAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Selection" ADD CONSTRAINT "Selection_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StudioOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectionItem" ADD CONSTRAINT "SelectionItem_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "Selection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectionItem" ADD CONSTRAINT "SelectionItem_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetouchTask" ADD CONSTRAINT "RetouchTask_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StudioOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetouchTask" ADD CONSTRAINT "RetouchTask_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetouchTask" ADD CONSTRAINT "RetouchTask_approvedVersionId_fkey" FOREIGN KEY ("approvedVersionId") REFERENCES "PhotoVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoVersion" ADD CONSTRAINT "PhotoVersion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RetouchTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoVersion" ADD CONSTRAINT "PhotoVersion_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "StoredAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRequest" ADD CONSTRAINT "RevisionRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RetouchTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRequest" ADD CONSTRAINT "RevisionRequest_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PhotoVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionRequest" ADD CONSTRAINT "RevisionRequest_responseVersionId_fkey" FOREIGN KEY ("responseVersionId") REFERENCES "PhotoVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StudioOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PhotoVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
