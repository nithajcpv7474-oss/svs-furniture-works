// Native fetch used

const API_URL = 'http://localhost:5005/api';

async function testAPI() {
  console.log('--- STARTING API QA ---');
  let token = '';

  try {
    console.log('1. Testing Login...');
    // Seed data has 15 users. Let's try to login as Admin (from seed)
    // Looking at seed.js, what is the admin credentials?
    // Usually admin@svsfurniture.com / admin123
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@svsfurniture.com', password: 'SVS@123' })
    });
    const loginData = await loginRes.json();
    if (loginData.data && loginData.data.token) {
      console.log('✅ Login Successful');
      token = loginData.data.token;
    } else {
      console.error('❌ Login Failed. Expected token, got:', loginData);
      // Wait, let's just create a new admin or check seed logs for the exact email.
      console.log('Proceeding with assuming seed data password is "password123" for users.');
    }

    if (!token) {
      // let's fetch any user via direct prisma to get an email, then login.
      console.log('Cannot proceed without token.');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const endpoints = [
      '/dashboard/summary',
      '/customers',
      '/orders',
      '/materials',
      '/inventory/transactions',
      '/production',
      '/delivery',
      '/users',
      '/reports/dashboard-charts',
      '/reports/sales',
      '/reports/inventory',
      '/reports/production',
      '/reports/delivery',
      '/settings',
      '/notifications',
      '/audit'
    ];

    for (const endpoint of endpoints) {
      console.log(`\nTesting GET ${endpoint}...`);
      const res = await fetch(`${API_URL}${endpoint}`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        // The data could be nested (e.g. data.data or data.length)
        const isArray = Array.isArray(data);
        const hasDataArray = data.data && Array.isArray(data.data);
        const count = isArray ? data.length : (hasDataArray ? data.data.length : 'Object');
        console.log(`✅ Success. Status: ${res.status}. Data count/type: ${count}`);
      } else {
        const errorText = await res.text();
        console.error(`❌ Failed. Status: ${res.status}. Error: ${errorText}`);
      }
    }

  } catch (error) {
    console.error('Critical Error in Test Script:', error);
  }
}

testAPI();
