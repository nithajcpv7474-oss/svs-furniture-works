-- CreateIndex
CREATE INDEX "Customer_status_isDeleted_idx" ON "Customer"("status", "isDeleted");

-- CreateIndex
CREATE INDEX "Delivery_orderId_idx" ON "Delivery"("orderId");

-- CreateIndex
CREATE INDEX "Delivery_customerId_idx" ON "Delivery"("customerId");

-- CreateIndex
CREATE INDEX "Delivery_productionJobId_idx" ON "Delivery"("productionJobId");

-- CreateIndex
CREATE INDEX "Delivery_vehicleId_idx" ON "Delivery"("vehicleId");

-- CreateIndex
CREATE INDEX "Delivery_deliveryStatus_idx" ON "Delivery"("deliveryStatus");

-- CreateIndex
CREATE INDEX "InventoryTransaction_materialId_idx" ON "InventoryTransaction"("materialId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "InventoryTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "Material_category_idx" ON "Material"("category");

-- CreateIndex
CREATE INDEX "Material_status_isDeleted_idx" ON "Material"("status", "isDeleted");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_orderStatus_isDeleted_idx" ON "Order"("orderStatus", "isDeleted");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderMaterial_orderId_idx" ON "OrderMaterial"("orderId");

-- CreateIndex
CREATE INDEX "OrderMaterial_materialId_idx" ON "OrderMaterial"("materialId");

-- CreateIndex
CREATE INDEX "ProductionJob_orderId_idx" ON "ProductionJob"("orderId");

-- CreateIndex
CREATE INDEX "ProductionJob_status_productionStage_idx" ON "ProductionJob"("status", "productionStage");

-- CreateIndex
CREATE INDEX "ProductionTask_productionJobId_idx" ON "ProductionTask"("productionJobId");

-- CreateIndex
CREATE INDEX "ProductionTask_status_idx" ON "ProductionTask"("status");

-- CreateIndex
CREATE INDEX "QualityInspection_productionJobId_idx" ON "QualityInspection"("productionJobId");

-- CreateIndex
CREATE INDEX "QualityInspection_inspectionStatus_idx" ON "QualityInspection"("inspectionStatus");
