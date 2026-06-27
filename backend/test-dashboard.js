import { getDashboardSummary } from './src/controllers/dashboard.controller.js';

async function run() {
  const req = {};
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Status:', this.statusCode);
      console.log('Payload:', JSON.stringify(data, null, 2));
    }
  };

  await getDashboardSummary(req, res);
}

run();
