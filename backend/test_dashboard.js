async function testDashboard() {
  console.log('Testing Dashboard Flow...');
  try {
    const loginRes = await fetch('http://localhost:5005/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@svsfurniture.com', password: 'Admin@123' }),
    });
    const loginData = await loginRes.json();
    
    if (loginRes.ok && loginData.token) {
      console.log('Login successful!');
      
      const dashRes = await fetch('http://localhost:5005/api/dashboard/summary', {
        headers: { 'Authorization': `Bearer ${loginData.token}` },
      });
      const dashData = await dashRes.json();
      console.log('Dashboard Data Status:', dashRes.status);
      console.log('Has KPIs?', !!dashData.kpis);
      console.log('Has Charts?', !!dashData.charts);
    } else {
      console.error('Login failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDashboard();
