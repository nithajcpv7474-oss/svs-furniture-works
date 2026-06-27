const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

async function runTest() {
  const email = `test_${Date.now()}@test.com`;
  const password = "myTestPassword1!";
  
  // Create user through API
  console.log('Creating user with password:', password);
  
  // Need an admin token
  const admin = await prisma.user.findFirst({ where: { role: 'Admin' } });
  
  const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });

  const res = await fetch('http://localhost:5005/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      fullName: 'Test User',
      email: email,
      phone: '1234567890',
      password: password,
      role: 'SalesStaff',
      isActive: true
    })
  });
  
  const resData = await res.json();
  console.log('API Response:', res.status, resData);
  
  // Check DB
  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser) {
    console.error('User not found in DB!');
    return;
  }
  
  console.log('DB Hashed Password:', dbUser.password);
  
  const isMatch = await bcrypt.compare(password, dbUser.password);
  console.log('Match with original password:', isMatch);
}

runTest().finally(() => prisma.$disconnect());
