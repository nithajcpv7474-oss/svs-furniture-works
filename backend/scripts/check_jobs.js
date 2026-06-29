import prisma from '../src/config/prisma.js'; async function main() { const jobs = await prisma.productionJob.findMany(); console.log('Jobs:', jobs); } main().finally(() => prisma.$disconnect());
