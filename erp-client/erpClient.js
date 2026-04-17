const axios = require('axios');

class ERPClient {
  constructor(baseUrl, erpType) {
    this.client = axios.create({
      baseURL: baseUrl,
      params: { erp: erpType }
    });
  }

  async getProducts() {
    const response = await this.client.get('/api/products');
    return response.data;
  }

  async getInventory() {
    const response = await this.client.get('/api/inventory');
    return response.data;
  }

  async getSales() {
    const response = await this.client.get('/api/sales');
    return response.data;
  }

  async getComplaints() {
    const response = await this.client.get('/api/complaints');
    return response.data;
  }
}

module.exports = ERPClient;
