const axios = require('axios');

class ShopifyService {
  constructor(shopDomain, accessToken) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.apiVersion = process.env.SHOPIFY_API_VERSION || '2024-10';
    
    this.client = axios.create({
      baseURL: `https://${shopDomain}/admin/api/${this.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async getAllCustomers(limit = 250) {
    try {
      console.log(`Fetching customers from ${this.shopDomain}...`);
      const response = await this.client.get('/customers.json', {
        params: { limit }
      });
      return response.data.customers || [];
    } catch (error) {
      console.error('Error fetching customers:', error.response?.data || error.message);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  async getAllOrders(limit = 250) {
    try {
      console.log(`Fetching orders from ${this.shopDomain}...`);
      const response = await this.client.get('/orders.json', {
        params: { limit, status: 'any' }
      });
      return response.data.orders || [];
    } catch (error) {
      console.error('Error fetching orders:', error.response?.data || error.message);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  async getAllProducts(limit = 250) {
    try {
      console.log(`Fetching products from ${this.shopDomain}...`);
      const response = await this.client.get('/products.json', {
        params: { limit }
      });
      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  async getShopInfo() {
    try {
      const response = await this.client.get('/shop.json');
      return response.data.shop;
    } catch (error) {
      console.error('Error fetching shop info:', error.response?.data || error.message);
      throw new Error(`Failed to fetch shop info: ${error.message}`);
    }
  }
}

module.exports = ShopifyService;