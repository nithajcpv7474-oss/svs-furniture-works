import prisma from '../src/config/prisma.js';

async function main() {
  await prisma.$executeRaw`UPDATE "User" SET role = 'Admin' WHERE role IN ('SalesStaff', 'ProductionStaff', 'DeliveryStaff');`;
  console.log('Roles updated to Admin temporarily.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
