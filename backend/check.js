import prisma from './src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'manujanu2454@gmail.com' },
  });
  console.log(user);
  if (user) {
    const isMatch = await bcrypt.compare('nyo412wrA1!', user.password);
    console.log('Match:', isMatch);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
