-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Pending', 'Confirmed', 'InProduction', 'QualityCheck', 'ReadyForDelivery', 'Delivered', 'Cancelled');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "furnitureCategory" TEXT NOT NULL,
    "furnitureName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "measurementUnit" TEXT DEFAULT 'Inches',
    "woodMaterial" TEXT,
    "finishType" TEXT,
    "hardwareDetails" TEXT,
    "upholsteryRequired" BOOLEAN NOT NULL DEFAULT false,
    "upholsteryMaterial" TEXT,
    "upholsteryColor" TEXT,
    "polishColor" TEXT,
    "glassRequired" BOOLEAN NOT NULL DEFAULT false,
    "glassType" TEXT,
    "accessories" TEXT,
    "estimatedPrice" DOUBLE PRECISION NOT NULL,
    "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAmount" DOUBLE PRECISION NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3),
    "deliveryAddress" TEXT,
    "specialInstructions" TEXT,
    "designImage" TEXT,
    "referenceDrawing" TEXT,
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'Pending',
    "priority" "Priority" NOT NULL DEFAULT 'Medium',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
