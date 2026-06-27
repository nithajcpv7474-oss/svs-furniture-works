import prisma from '../src/config/prisma.js';

async function restoreAdmin() {
  await prisma.user.updateMany({
    where: { email: 'admin@svsfurniture.com' },
    data: { role: 'Admin' }
  });
  console.log('Restored admin@svsfurniture.com to Admin role');
}

restoreAdmin().finally(() => prisma.$disconnect());
