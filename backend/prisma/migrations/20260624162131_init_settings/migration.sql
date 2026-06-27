-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL DEFAULT '1',
    "companyName" TEXT NOT NULL DEFAULT 'SVS Furniture',
    "companyEmail" TEXT NOT NULL DEFAULT 'contact@svsfurniture.com',
    "companyPhone" TEXT NOT NULL DEFAULT '',
    "companyAddress" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 18.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);
