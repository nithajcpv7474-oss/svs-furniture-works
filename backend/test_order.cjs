const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testOrders() {
  console.log('Testing Order API Flow...');
  try {
    const loginRes = await axios.post('http://localhost:5005/api/auth/login', {
      email: 'admin@svsfurniture.com',
      password: 'Admin@123'
    });
    const token = loginRes.data.token;
    
    if (token) {
      console.log('Login successful!');

      // Create a test file
      const testFilePath = path.join(__dirname, 'test_image.png');
      fs.writeFileSync(testFilePath, 'dummy image content');
      
      // Create Customer first (using unique phone number)
      const phoneStr = '888' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      const custRes = await axios.post('http://localhost:5005/api/customers', {
        fullName: 'Order Test Customer',
        phone: phoneStr,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const customerId = custRes.data.id;
      console.log('Customer created with ID:', customerId);

      // Create Order with form data
      const formData = new FormData();
      formData.append('customerId', customerId);
      formData.append('furnitureCategory', 'Sofa');
      formData.append('furnitureName', '3-Seater Chesterfield');
      formData.append('quantity', '2');
      formData.append('estimatedPrice', '45000');
      formData.append('advanceAmount', '10000');
      formData.append('balanceAmount', '35000');
      formData.append('upholsteryRequired', 'true');
      
      // Attach the dummy image
      formData.append('designImage', fs.createReadStream(testFilePath));

      const createRes = await axios.post('http://localhost:5005/api/orders', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        }
      });

      console.log('\n--- 1. Create Order Response ---');
      console.log(createRes.status, createRes.data.orderNumber);
      const orderId = createRes.data.id;

      // 2. Get Orders
      const listRes = await axios.get('http://localhost:5005/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log('\n--- 2. List Orders Response ---');
      console.log(listRes.status, `Total orders: ${listRes.data.meta.total}`);

      // 3. Update Order
      const updateData = new FormData();
      updateData.append('orderStatus', 'InProduction');
      const updateRes = await axios.put(`http://localhost:5005/api/orders/${orderId}`, updateData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          ...updateData.getHeaders()
        },
      });
      console.log('\n--- 3. Update Order Response ---');
      console.log(updateRes.status, updateRes.data.orderStatus);

      // 4. Delete Order
      const delRes = await axios.delete(`http://localhost:5005/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log('\n--- 4. Delete Order Response ---');
      console.log(delRes.status, delRes.data);

      // 5. Cleanup
      fs.unlinkSync(testFilePath);
      await axios.delete(`http://localhost:5005/api/customers/${customerId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testOrders();
