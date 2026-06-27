async function testAuth() {
  console.log('Testing Register Flow...');
  try {
    const res = await fetch('http://localhost:5005/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test User', email: 'test@example.com', password: 'testpassword' }),
    });

    const data = await res.json();
    console.log('Register Response:', data);
    
    if (res.ok && data.token) {
      console.log('Register successful!');
      
      console.log('Testing Login Flow for Test User...');
      const loginRes = await fetch('http://localhost:5005/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'testpassword' }),
      });
      const loginData = await loginRes.json();
      console.log('Login Response:', loginData);
    } else {
      console.error('Register failed');
    }
  } catch (error) {
    console.error('Error during testing:', error.message);
  }
}

testAuth();
