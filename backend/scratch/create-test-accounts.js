import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

const accounts = [
  { role: 'Management', email: 'mgmt_test@svsfurniture.com', password: 'SVS#Mgmt@2025' },
  { role: 'Sales Staff', email: 'sales_test@svsfurniture.com', password: 'SVS#Sales@2025' },
  { role: 'Production Staff', email: 'prod_test@svsfurniture.com', password: 'SVS#Prod@2025' },
  { role: 'Delivery Staff', email: 'delivery_test@svsfurniture.com', password: 'SVS#Dlvry@2025' }
];

async function main() {
  for (const acc of accounts) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(acc.password, salt);
    
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        password: hashedPassword,
        role: acc.role,
        isActive: true
      },
      create: {
        fullName: acc.role,
        email: acc.email,
        phone: '0000000000',
        password: hashedPassword,
        role: acc.role,
        isActive: true
      }
    });
    console.log(`Upserted ${acc.email} with role ${acc.role}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
