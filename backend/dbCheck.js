import prisma from './src/config/prisma.js';

async function main() {
  const statuses = await prisma.order.findMany({ select: { orderStatus: true }, distinct: ['orderStatus'] });
  console.log('Current statuses in DB:', statuses.map(s => s.orderStatus));
  
  const tables = await prisma.$queryRawUnsafe(`SELECT * FROM information_schema.tables WHERE table_name = 'OrderStatusHistory'`);
  console.log('OrderStatusHistory table exists?', tables.length > 0 ? 'Yes' : 'No');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
