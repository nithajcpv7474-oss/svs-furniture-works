import prisma from '../src/config/prisma.js';

async function seedNotifications() {
  const notifications = [
    {
      title: 'New Order Received',
      message: 'Order ORD-2026-001 placed for Custom Dining Table worth ₹85,000',
      type: 'NEW_ORDER',
      priority: 'medium',
    },
    {
      title: 'Low Stock Alert',
      message: 'Teak Wood (MAT-001) is below minimum stock. Available: 5, Minimum: 20',
      type: 'LOW_STOCK',
      priority: 'high',
    },
    {
      title: 'Production Delayed',
      message: 'Production job PROD-2026-015 has exceeded its expected completion date.',
      type: 'DELAYED_PRODUCTION',
      priority: 'critical',
    },
    {
      title: 'Order Completed',
      message: 'Order ORD-2026-045 (6-Seater Sofa Set) has been completed successfully.',
      type: 'COMPLETED_ORDER',
      priority: 'low',
    },
    {
      title: 'Delivery Overdue',
      message: 'Delivery DEL-2026-008 has passed its expected delivery date.',
      type: 'LATE_DELIVERY',
      priority: 'critical',
    },
    {
      title: 'New User Created',
      message: 'Ravi Kumar (ravi@svs.com) has been added as Staff.',
      type: 'USER_CREATED',
      priority: 'low',
    },
    {
      title: 'Order Status Updated',
      message: 'Order ORD-2026-032 status changed to InProduction.',
      type: 'ORDER_STATUS_CHANGE',
      priority: 'medium',
    },
    {
      title: 'Low Stock Alert',
      message: 'Plywood Sheets (MAT-012) is below minimum stock. Available: 3, Minimum: 15',
      type: 'LOW_STOCK',
      priority: 'high',
    },
    {
      title: 'New Order Received',
      message: 'Order ORD-2026-078 placed for Executive Office Desk worth ₹42,500',
      type: 'NEW_ORDER',
      priority: 'medium',
    },
    {
      title: 'Production Delayed',
      message: 'Production job PROD-2026-023 is 5 days behind schedule.',
      type: 'DELAYED_PRODUCTION',
      priority: 'critical',
    },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  console.log(`Seeded ${notifications.length} notifications.`);
  await prisma.$disconnect();
}

seedNotifications().catch(e => { console.error(e); process.exit(1); });
