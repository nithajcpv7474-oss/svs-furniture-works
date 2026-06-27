import prisma from '../src/config/prisma.js';

async function runTest() {
  await prisma.user.updateMany({ data: { role: 'Sales_Staff' } });
}
runTest();
