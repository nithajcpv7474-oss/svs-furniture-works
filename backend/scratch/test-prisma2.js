import prisma from '../src/config/prisma.js';

async function runTest() {
  const users = await prisma.user.findMany({ select: { role: true } });
  console.log(users);
}
runTest().finally(() => prisma.$disconnect());
