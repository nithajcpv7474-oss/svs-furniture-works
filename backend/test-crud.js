// native fetch

const API_URL = 'http://localhost:5005/api';

async function testCRUD() {
  console.log('--- STARTING CRUD QA ---');
  let token = '';

  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@svsfurniture.com', password: 'SVS@123' })
    });
    const loginData = await loginRes.json();
    if (loginData.data && loginData.data.token) {
      token = loginData.data.token;
    } else {
      console.error('Login Failed');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test Create Customer
    const testCustomer = {
      customerCode: `TEST-${Date.now()}`,
      fullName: 'QA Tester',
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `test${Date.now()}@example.com`,
      customerType: 'Retail'
    };

    console.log('\nCreating Customer...');
    const createRes = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testCustomer)
    });
    
    if (createRes.ok) {
      const newCustomer = await createRes.json();
      console.log('✅ Create Successful. ID:', newCustomer.id);
      
      // Test Update Customer
      console.log('Updating Customer...');
      const updateRes = await fetch(`${API_URL}/customers/${newCustomer.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ fullName: 'QA Tester Updated', phone: testCustomer.phone })
      });
      if (updateRes.ok) {
        console.log('✅ Update Successful');
      } else {
        console.error('❌ Update Failed:', await updateRes.text());
      }
      
      // Test Delete Customer
      console.log('Deleting Customer...');
      const deleteRes = await fetch(`${API_URL}/customers/${newCustomer.id}`, {
        method: 'DELETE',
        headers
      });
      if (deleteRes.ok) {
        console.log('✅ Delete Successful');
      } else {
        console.error('❌ Delete Failed:', await deleteRes.text());
      }
    } else {
      console.error('❌ Create Failed:', await createRes.text());
    }

  } catch (error) {
    console.error('Critical Error:', error);
  }
}

testCRUD();
