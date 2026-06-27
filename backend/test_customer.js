async function testCustomers() {
  console.log('Testing Customer API Flow...');
  try {
    const loginRes = await fetch('http://localhost:5005/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@svsfurniture.com', password: 'Admin@123' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    if (loginRes.ok && token) {
      console.log('Login successful!');
      
      // 1. Create a new Customer
      console.log('\n--- 1. Creating Customer ---');
      const createRes = await fetch('http://localhost:5005/api/customers', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Test User',
          phone: '9999999999',
          email: 'test@example.com',
          customerType: 'Retail',
          status: 'Active'
        }),
      });
      const createData = await createRes.json();
      console.log('Create Response:', createRes.status, createData);

      if (createRes.status !== 201) throw new Error('Create Failed');
      const customerId = createData.id;

      // 2. Duplicate Validation
      console.log('\n--- 2. Testing Duplicates ---');
      const dupRes = await fetch('http://localhost:5005/api/customers', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Test Duplicate',
          phone: '9999999999', // same phone
        }),
      });
      const dupData = await dupRes.json();
      console.log('Duplicate Response (Should be 400):', dupRes.status, dupData);

      // 3. Get Customers (List)
      console.log('\n--- 3. Listing Customers ---');
      const listRes = await fetch('http://localhost:5005/api/customers?search=Test', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const listData = await listRes.json();
      console.log('List Response:', listRes.status, `Total found: ${listData.meta.total}`);

      // 4. Update Customer
      console.log('\n--- 4. Updating Customer ---');
      const updateRes = await fetch(`http://localhost:5005/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Test User Updated',
        }),
      });
      const updateData = await updateRes.json();
      console.log('Update Response:', updateRes.status, updateData.fullName);

      // 5. Delete Customer (Soft Delete)
      console.log('\n--- 5. Deleting Customer ---');
      const delRes = await fetch(`http://localhost:5005/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const delData = await delRes.json();
      console.log('Delete Response:', delRes.status, delData);

      // 6. Verify Dashboard Count
      console.log('\n--- 6. Verify Dashboard Stats ---');
      const dashRes = await fetch('http://localhost:5005/api/dashboard/summary', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const dashData = await dashRes.json();
      console.log('Dashboard Customer KPI:', dashData.kpis.totalCustomers);

    } else {
      console.error('Login failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCustomers();
