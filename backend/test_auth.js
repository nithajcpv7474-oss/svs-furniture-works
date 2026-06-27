async function testAuth() {
  console.log('Testing Login Flow...');
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@svsfurniture.com', password: 'Admin@123' }),
    });

    const data = await res.json();
    
    if (res.ok && data.token) {
      console.log('Login successful! User:', data.email);
      
      console.log('Testing Protected Route (/api/auth/me)...');
      const meRes = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${data.token}` },
      });
      const meData = await meRes.json();
      if (meRes.ok && meData.email === 'admin@svsfurniture.com') {
        console.log('Protected route successful! User role:', meData.role);
      } else {
        console.error('Protected route failed', meData);
      }
    } else {
      console.error('Login failed', data);
    }
  } catch (error) {
    console.error('Error during testing:', error.message);
  }
}

testAuth();
