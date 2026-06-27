import prisma from './src/config/prisma.js';
import { createProductionJob } from './src/services/production.service.js';

async function runTest() {
  try {
    console.log('--- Setting up test data ---');
    // 1. Create a customer
    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUST-${Date.now()}`,
        fullName: 'Test Customer',
        phone: `${Date.now()}`.substring(0, 10),
        email: `test${Date.now()}@customer.com`
      }
    });

    // 2. Create a material with ONLY 10 stock
    const material = await prisma.material.create({
      data: {
        materialCode: `MAT-${Date.now()}`,
        materialName: 'Test Leather',
        category: 'Upholstery',
        unit: 'Meters',
        availableStock: 10
      }
    });

    // 3. Create an order that requires 50 stock (should FAIL)
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderNumber: `TEST-${Date.now()}`,
        furnitureCategory: 'Sofa',
        furnitureName: 'Leather Sofa',
        quantity: 1,
        estimatedPrice: 1000,
        balanceAmount: 1000,
        orderMaterials: {
          create: [
            { materialId: material.id, quantityRequired: 50 }
          ]
        }
      }
    });

    console.log('--- Attempting Production (Should Fail due to shortage) ---');
    try {
      await createProductionJob({
        orderId: order.id,
        priority: 'High'
      });
      console.error('❌ FAIL: Expected insufficient stock error but it succeeded.');
    } catch (err) {
      if (err.message === 'INSUFFICIENT_STOCK') {
        console.log('✅ PASS: Caught INSUFFICIENT_STOCK error!');
        console.log('Shortages:', err.shortages);
      } else {
        console.error('❌ FAIL: Unexpected error:', err.message);
      }
    }

    console.log('--- Updating Stock to 100 ---');
    await prisma.material.update({
      where: { id: material.id },
      data: { availableStock: 100 }
    });

    console.log('--- Attempting Production Again (Should Succeed) ---');
    const job = await createProductionJob({
      orderId: order.id,
      priority: 'High'
    });
    console.log('✅ PASS: Production Job created:', job.productionNumber);

    console.log('--- Verifying Deductions & Transactions ---');
    const updatedMaterial = await prisma.material.findUnique({ where: { id: material.id }});
    console.log(`Material Stock: ${updatedMaterial.availableStock} (Expected: 50)`);

    const tx = await prisma.inventoryTransaction.findFirst({
      where: { reference: job.productionNumber }
    });
    console.log(`Inventory Transaction Created: ${tx ? 'Yes' : 'No'}, Qty: ${tx?.quantity}`);

    if (updatedMaterial.availableStock === 50 && tx?.quantity === 50) {
      console.log('✅ PASS: Atomic deduction successful.');
    } else {
      console.error('❌ FAIL: Deduction failed.');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
