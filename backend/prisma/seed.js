import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const customerNames = [
  'Arjun Reddy', 'Priya Sharma', 'Vikram Singh', 'Meera Patel', 'Rajesh Kumar', 'Neha Gupta', 'Amit Desai', 'Sneha Iyer', 'Rahul Verma', 'Pooja Rao',
  'Siddharth Menon', 'Ananya Joshi', 'Karthik Nair', 'Kavya Pillai', 'Manoj Tiwari', 'Riya Kapoor', 'Sanjay Yadav', 'Aarti Chawla', 'Rohan Mehta', 'Shruti Hassan',
  'Abhinav Shukla', 'Swati Mishra', 'Deepak Chauhan', 'Kiran Bedi', 'Nitin Gadkari', 'Smriti Irani', 'Vivek Oberoi', 'Tara Sutaria', 'Varun Dhawan', 'Alia Bhatt'
];

const vehiclePlates = [
  'TS 07 EA 1234', 'AP 09 CB 5678', 'TS 08 FA 9012', 'AP 29 BZ 3456', 'TS 09 XY 7890',
  'AP 16 CH 2345', 'TS 10 KL 6789', 'AP 31 TR 0123', 'TS 11 MN 4567', 'AP 39 PQ 8901'
];

const materialCategories = {
  Wood: ['Teak Wood (Grade A)', 'Rosewood (Premium)', 'Plywood (18mm)', 'MDF Board', 'Particle Board', 'Oak Wood', 'Walnut Wood', 'Mahogany Wood', 'Pine Wood', 'Cedar Wood'],
  Hardware: ['SS Hinges', 'Drawer Channels', 'Door Handles', 'Magnetic Catchers', 'Screws (1 inch)', 'Screws (2 inch)', 'Nails (1 inch)', 'Wood Glue (1L)', 'Locks', 'Casters'],
  Upholstery: ['Leather (Black)', 'Leather (Brown)', 'Velvet (Red)', 'Cotton Fabric', 'Foam (High Density)', 'Foam (Medium)', 'Springs', 'Webbing', 'Thread', 'Buttons'],
  Finish: ['PU Polish (Clear)', 'Melamine Polish', 'Wood Primer', 'Enamel Paint (White)', 'Enamel Paint (Black)', 'Thinner', 'Sandpaper (80 grit)', 'Sandpaper (120 grit)', 'Wood Filler', 'Varnish']
};

async function main() {
  console.log('--- CLEANING DATABASE ---');
  await prisma.delivery.deleteMany();
  await prisma.qualityInspection.deleteMany();
  await prisma.productionTask.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.productionJob.deleteMany();
  await prisma.orderMaterial.deleteMany();
  await prisma.order.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.material.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- GENERATING 15 USERS ---');
  const password = await bcrypt.hash('SVS@123', 10);
  const usersToCreate = [];
  
  // 1 Admin
  usersToCreate.push({ fullName: 'System Admin', email: 'admin@svsfurniture.com', password, role: 'Admin', phone: '9999999990' });
  
  // 3 Managers
  for(let i=1; i<=3; i++) {
    usersToCreate.push({ fullName: `Store Manager ${i}`, email: `manager${i}@svsfurniture.com`, password, role: 'Manager', phone: `999999999${i}` });
  }
  
  // 11 Staff
  for(let i=1; i<=11; i++) {
    usersToCreate.push({ fullName: `Sales Staff ${i}`, email: `staff${i}@svsfurniture.com`, password, role: 'Staff', phone: `88888888${i < 10 ? '0'+i : i}` });
  }

  const users = await prisma.$transaction(usersToCreate.map(data => prisma.user.create({ data })));
  const adminId = users[0].id;

  console.log('--- GENERATING 10 VEHICLES ---');
  const vehiclesToCreate = vehiclePlates.map((plate, idx) => ({
    vehicleNumber: plate,
    vehicleType: idx % 2 === 0 ? 'Tata Ace' : 'Ashok Leyland Dost',
    capacity: '1 Ton',
    status: 'Available'
  }));
  const vehicles = await prisma.$transaction(vehiclesToCreate.map(data => prisma.vehicle.create({ data })));

  console.log('--- GENERATING 30 CUSTOMERS ---');
  const customersToCreate = customerNames.map((name, idx) => ({
    customerCode: `CUST-${2000 + idx}`,
    fullName: name,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    email: `customer${idx}@example.com`,
    city: idx % 3 === 0 ? 'Hyderabad' : 'Secunderabad',
    customerType: idx % 5 === 0 ? 'Dealer' : 'Retail'
  }));
  const customers = await prisma.$transaction(customersToCreate.map(data => prisma.customer.create({ data })));

  console.log('--- GENERATING 40 MATERIALS ---');
  const materialsToCreate = [];
  let mCode = 1000;
  for (const [category, items] of Object.entries(materialCategories)) {
    for (const item of items) {
      materialsToCreate.push({
        materialCode: `MAT-${mCode++}`,
        materialName: item,
        category: category,
        unit: category === 'Wood' ? 'CFT' : category === 'Hardware' ? 'Pieces' : category === 'Upholstery' ? 'Meters' : 'Liters',
        minimumStock: 20,
        reorderLevel: 50,
        purchasePrice: randomInt(100, 2000),
        availableStock: 0 // Will be filled by StockIn transactions
      });
    }
  }
  let materials = await prisma.$transaction(materialsToCreate.map(data => prisma.material.create({ data })));

  console.log('--- GENERATING 140 BASE INVENTORY TRANSACTIONS ---');
  // Target: exactly 200. We will have exactly 30 Jobs * 2 Materials = 60 StockOuts later. 140 Base StockIns.
  const transactionsToCreate = [];
  const now = new Date();
  
  for (let i = 0; i < 140; i++) {
    const mat = materials[i % 40]; // ensure all materials get stock
    const qty = randomInt(50, 300);
    const pastDate = new Date(now.getTime() - randomInt(0, 365) * 24 * 60 * 60 * 1000);
    transactionsToCreate.push(prisma.inventoryTransaction.create({
      data: {
        materialId: mat.id,
        transactionType: 'StockIn',
        quantity: qty,
        reference: `PO-${5000 + i}`,
        createdBy: adminId,
        createdAt: pastDate
      }
    }));
  }
  await prisma.$transaction(transactionsToCreate);

  // Sync available stock
  for (const mat of materials) {
    const agg = await prisma.inventoryTransaction.aggregate({
      where: { materialId: mat.id },
      _sum: { quantity: true }
    });
    await prisma.material.update({
      where: { id: mat.id },
      data: { availableStock: agg._sum.quantity || 0 }
    });
  }
  materials = await prisma.material.findMany(); // refresh

  console.log('--- GENERATING 75 ORDERS OVER 12 MONTHS ---');
  // 75 Orders: 25 Fully Completed (Jobs, Tasks, QA, Delivery), 5 In Production, 45 Pending.
  // 25 Completed * 3 Tasks = 75 Tasks. 5 In Production * 5 Tasks = 25 Tasks. Total Tasks = 100.
  // 25 Completed = 25 Deliveries, 25 QA Inspections.
  // 25 + 5 = 30 Production Jobs.
  // Exactly 2 orderMaterials per job = 60 StockOut transactions. 140 + 60 = 200 Inventory Transactions.
  
  let oCode = 5000;
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  
  const furnitureTypes = ['Sofa Set', 'Dining Table', 'Wardrobe', 'King Size Bed', 'Study Desk', 'TV Unit', 'Bookshelf'];

  // 1. Generate 25 Fully Completed Orders (Spread over last 12 months up to 2 weeks ago)
  for (let i = 0; i < 25; i++) {
    const oDate = new Date(oneYearAgo.getTime() + (i / 25) * 340 * 24 * 60 * 60 * 1000);
    const cust = randomElement(customers);
    const m1 = randomElement(materials);
    const m2 = randomElement(materials.filter(m => m.id !== m1.id));
    
    const estPrice = randomInt(15000, 150000);
    
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${oCode++}`,
        customerId: cust.id,
        furnitureCategory: randomElement(['Living Room', 'Bedroom', 'Dining', 'Office']),
        furnitureName: randomElement(furnitureTypes),
        quantity: 1,
        estimatedPrice: estPrice,
        advanceAmount: estPrice * 0.5,
        balanceAmount: 0,
        orderStatus: 'Delivered',
        createdBy: adminId,
        createdAt: oDate,
        updatedAt: new Date(oDate.getTime() + 15 * 24 * 60 * 60 * 1000), // delivered 15 days later
        orderMaterials: {
          create: [
            { materialId: m1.id, quantityRequired: randomInt(2, 5) },
            { materialId: m2.id, quantityRequired: randomInt(2, 5) }
          ]
        }
      },
      include: { orderMaterials: true }
    });

    const pDate = new Date(oDate.getTime() + 2 * 24 * 60 * 60 * 1000); // production starts 2 days later
    const job = await prisma.productionJob.create({
      data: {
        productionNumber: `PROD-${order.orderNumber}`,
        orderId: order.id,
        productionStage: 'ReadyForDelivery',
        startDate: pDate,
        expectedCompletionDate: new Date(pDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        actualCompletionDate: new Date(pDate.getTime() + 8 * 24 * 60 * 60 * 1000),
        status: 'Completed',
        createdAt: pDate,
        updatedAt: new Date(pDate.getTime() + 8 * 24 * 60 * 60 * 1000)
      }
    });

    // Deduct stock (exactly 2 materials) -> 2 StockOuts
    for (const om of order.orderMaterials) {
      await prisma.inventoryTransaction.create({
        data: {
          materialId: om.materialId,
          transactionType: 'StockOut',
          quantity: -om.quantityRequired,
          reference: job.productionNumber,
          createdBy: adminId,
          createdAt: pDate
        }
      });
      await prisma.material.update({
        where: { id: om.materialId },
        data: { availableStock: { decrement: om.quantityRequired } }
      });
    }

    // 3 Tasks
    const tNames = ['Wood Cutting', 'Assembly', 'Finishing'];
    for (let t = 0; t < 3; t++) {
      await prisma.productionTask.create({
        data: {
          productionJobId: job.id,
          taskName: tNames[t],
          status: 'Completed',
          actualHours: randomInt(4, 16),
          createdAt: new Date(pDate.getTime() + t * 24 * 60 * 60 * 1000),
          updatedAt: new Date(pDate.getTime() + (t + 1) * 24 * 60 * 60 * 1000)
        }
      });
    }

    // 1 Quality Inspection
    const qDate = new Date(pDate.getTime() + 9 * 24 * 60 * 60 * 1000);
    await prisma.qualityInspection.create({
      data: {
        productionJobId: job.id,
        inspectorName: 'Admin',
        inspectionDate: qDate,
        inspectionStatus: 'Passed',
        createdAt: qDate,
        updatedAt: qDate
      }
    });

    // 1 Delivery
    const dDate = new Date(qDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    await prisma.delivery.create({
      data: {
        deliveryNumber: `DEL-${order.orderNumber}`,
        orderId: order.id,
        customerId: cust.id,
        productionJobId: job.id,
        vehicleId: randomElement(vehicles).id,
        deliveryStatus: 'Delivered',
        dispatchDate: dDate,
        expectedDeliveryDate: dDate,
        actualDeliveryDate: dDate,
        createdAt: dDate,
        updatedAt: dDate
      }
    });
  }

  // 2. Generate 5 In Production Orders (Recent 2 weeks)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  for (let i = 0; i < 5; i++) {
    const oDate = new Date(twoWeeksAgo.getTime() + i * 2 * 24 * 60 * 60 * 1000);
    const cust = randomElement(customers);
    const m1 = randomElement(materials);
    const m2 = randomElement(materials.filter(m => m.id !== m1.id));
    
    const estPrice = randomInt(15000, 150000);
    
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${oCode++}`,
        customerId: cust.id,
        furnitureCategory: randomElement(['Living Room', 'Bedroom', 'Dining', 'Office']),
        furnitureName: randomElement(furnitureTypes),
        quantity: 1,
        estimatedPrice: estPrice,
        advanceAmount: estPrice * 0.5,
        balanceAmount: estPrice * 0.5,
        orderStatus: 'InProduction',
        createdBy: adminId,
        createdAt: oDate,
        updatedAt: oDate,
        orderMaterials: {
          create: [
            { materialId: m1.id, quantityRequired: randomInt(2, 5) },
            { materialId: m2.id, quantityRequired: randomInt(2, 5) }
          ]
        }
      },
      include: { orderMaterials: true }
    });

    const pDate = new Date(oDate.getTime() + 1 * 24 * 60 * 60 * 1000); 
    const job = await prisma.productionJob.create({
      data: {
        productionNumber: `PROD-${order.orderNumber}`,
        orderId: order.id,
        productionStage: 'Assembly',
        startDate: pDate,
        expectedCompletionDate: new Date(pDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'InProgress',
        createdAt: pDate,
        updatedAt: pDate
      }
    });

    // Deduct stock (exactly 2 materials) -> 2 StockOuts
    for (const om of order.orderMaterials) {
      await prisma.inventoryTransaction.create({
        data: {
          materialId: om.materialId,
          transactionType: 'StockOut',
          quantity: -om.quantityRequired,
          reference: job.productionNumber,
          createdBy: adminId,
          createdAt: pDate
        }
      });
      await prisma.material.update({
        where: { id: om.materialId },
        data: { availableStock: { decrement: om.quantityRequired } }
      });
    }

    // 5 Tasks each (Total = 25 Tasks)
    const tNames = ['Material Allocation', 'Wood Cutting', 'Assembly', 'Polishing', 'Finishing'];
    for (let t = 0; t < 5; t++) {
      const isCompleted = t < 2; // First 2 completed, rest pending/in progress
      await prisma.productionTask.create({
        data: {
          productionJobId: job.id,
          taskName: tNames[t],
          status: isCompleted ? 'Completed' : (t === 2 ? 'InProgress' : 'Pending'),
          estimatedHours: 8,
          createdAt: new Date(pDate.getTime() + t * 60 * 60 * 1000),
          updatedAt: new Date(pDate.getTime() + t * 60 * 60 * 1000)
        }
      });
    }
  }

  // 3. Generate 45 Pending Orders (Spread over last 3 months)
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  for (let i = 0; i < 45; i++) {
    const oDate = new Date(threeMonthsAgo.getTime() + (i / 45) * 90 * 24 * 60 * 60 * 1000);
    const cust = randomElement(customers);
    
    const estPrice = randomInt(15000, 150000);
    
    await prisma.order.create({
      data: {
        orderNumber: `ORD-${oCode++}`,
        customerId: cust.id,
        furnitureCategory: randomElement(['Living Room', 'Bedroom', 'Dining', 'Office']),
        furnitureName: randomElement(furnitureTypes),
        quantity: 1,
        estimatedPrice: estPrice,
        advanceAmount: estPrice * 0.2,
        balanceAmount: estPrice * 0.8,
        orderStatus: randomElement(['Pending', 'Confirmed']),
        createdBy: adminId,
        createdAt: oDate,
        updatedAt: oDate,
        orderMaterials: {
          // Add dummy materials so the DB counts don't complain, but no ProductionJob/StockOut is created yet.
          create: [
            { materialId: randomElement(materials).id, quantityRequired: randomInt(2, 5) }
          ]
        }
      }
    });
  }

  console.log('--- SEEDING COMPLETE ---');
  
  // Verify totals
  console.log({
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    materials: await prisma.material.count(),
    orders: await prisma.order.count(),
    productionJobs: await prisma.productionJob.count(),
    productionTasks: await prisma.productionTask.count(),
    qualityInspections: await prisma.qualityInspection.count(),
    deliveries: await prisma.delivery.count(),
    inventoryTransactions: await prisma.inventoryTransaction.count(),
    vehicles: await prisma.vehicle.count()
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
