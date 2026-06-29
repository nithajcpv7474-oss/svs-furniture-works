import 'dotenv/config';
import prisma from '../src/config/prisma.js';

async function main() {
  const ordersNeedingDelivery = await prisma.order.findMany({
    where: {
      orderStatus: { in: ['ReadyForDelivery', 'Delivered', 'Completed'] },
      delivery: null
    },
    include: { customer: true }
  });

  console.log(`Found ${ordersNeedingDelivery.length} orders needing delivery migration.`);

  const adminUser = await prisma.user.findFirst({
    where: { role: 'Admin' }
  });

  const adminUserId = adminUser ? adminUser.id : 'SYSTEM';

  for (const order of ordersNeedingDelivery) {
    const deliveryNumber = `DEL-${order.orderNumber}-${Date.now().toString().slice(-4)}`;
    const deliveryStatus = (order.orderStatus === 'Delivered' || order.orderStatus === 'Completed') ? 'Delivered' : 'Scheduled';
    
    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        orderId: order.id,
        customerId: order.customerId,
        deliveryStatus: deliveryStatus,
        deliveryType: 'HomeDelivery',
        deliveryAddress: order.deliveryAddress || null,
        actualDeliveryDate: deliveryStatus === 'Delivered' ? order.updatedAt : null,
      }
    });

    await prisma.deliveryHistory.create({
      data: {
        deliveryId: delivery.id,
        toStatus: deliveryStatus,
        changedBy: adminUserId,
        notes: 'Migrated from existing order',
      }
    });
    
    console.log(`Migrated order ${order.orderNumber} -> Delivery ${deliveryNumber}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
