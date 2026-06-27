-- CreateEnum
CREATE TYPE "ProductionStage" AS ENUM ('MaterialAllocation', 'WoodCutting', 'Assembly', 'Finishing', 'Painting', 'Upholstery', 'QualityInspection', 'Packing', 'ReadyForDelivery');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('NotStarted', 'InProgress', 'OnHold', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('Pending', 'InProgress', 'Completed');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('Pending', 'Passed', 'Failed', 'NeedsRework');

-- CreateTable
CREATE TABLE "ProductionJob" (
    "id" TEXT NOT NULL,
    "productionNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productionStage" "ProductionStage" NOT NULL DEFAULT 'MaterialAllocation',
    "assignedEmployee" TEXT,
    "startDate" TIMESTAMP(3),
    "expectedCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'Medium',
    "status" "JobStatus" NOT NULL DEFAULT 'NotStarted',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionTask" (
    "id" TEXT NOT NULL,
    "productionJobId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "assignedTo" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "status" "TaskStatus" NOT NULL DEFAULT 'Pending',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" TEXT NOT NULL,
    "productionJobId" TEXT NOT NULL,
    "inspectorName" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "inspectionStatus" "InspectionStatus" NOT NULL DEFAULT 'Pending',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionJob_productionNumber_key" ON "ProductionJob"("productionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionJob_orderId_key" ON "ProductionJob"("orderId");

-- AddForeignKey
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTask" ADD CONSTRAINT "ProductionTask_productionJobId_fkey" FOREIGN KEY ("productionJobId") REFERENCES "ProductionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_productionJobId_fkey" FOREIGN KEY ("productionJobId") REFERENCES "ProductionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
