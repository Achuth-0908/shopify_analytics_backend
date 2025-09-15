const { Tenant, Customer, Order, Product } = require('../models');
const ShopifyService = require('./shopifyService');

class SyncService {
  async syncTenantData(tenantId) {
    try {
      console.log(`Starting sync for tenant: ${tenantId}`);
      
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const shopify = new ShopifyService(tenant.shopDomain, tenant.accessToken);
      
      // Sync in parallel for better performance
      const [customers, orders, products] = await Promise.all([
        shopify.getAllCustomers(),
        shopify.getAllOrders(),
        shopify.getAllProducts()
      ]);

      const syncResults = {
        customers: await this.syncCustomers(tenantId, customers),
        orders: await this.syncOrders(tenantId, orders),
        products: await this.syncProducts(tenantId, products)
      };

      // Update last sync time
      await tenant.update({ lastSyncAt: new Date() });

      console.log(`Sync completed for tenant: ${tenantId}`, syncResults);
      return syncResults;
    } catch (error) {
      console.error(`Sync failed for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async syncCustomers(tenantId, customers) {
    let created = 0, updated = 0;

    for (const customerData of customers) {
      try {
        const [customer, wasCreated] = await Customer.upsert({
          shopifyCustomerId: customerData.id,
          tenantId,
          email: customerData.email,
          firstName: customerData.first_name,
          lastName: customerData.last_name,
          phone: customerData.phone,
          totalSpent: parseFloat(customerData.total_spent || 0),
          ordersCount: customerData.orders_count || 0,
          acceptsMarketing: customerData.accepts_marketing || false,
          tags: customerData.tags,
          addresses: customerData.addresses || [],
          shopifyCreatedAt: customerData.created_at,
          shopifyUpdatedAt: customerData.updated_at
        }, {
          fields: [
            'email', 'firstName', 'lastName', 'phone', 'totalSpent',
            'ordersCount', 'acceptsMarketing', 'tags', 'addresses', 'shopifyUpdatedAt'
          ]
        });

        wasCreated ? created++ : updated++;
      } catch (error) {
        console.error(`Error syncing customer ${customerData.id}:`, error);
      }
    }

    return { created, updated, total: customers.length };
  }

  async syncOrders(tenantId, orders) {
    let created = 0, updated = 0;

    for (const orderData of orders) {
      try {
        // Find associated customer
        let customerId = null;
        if (orderData.customer?.id) {
          const customer = await Customer.findOne({
            where: {
              tenantId,
              shopifyCustomerId: orderData.customer.id
            }
          });
          customerId = customer?.id;
        }

        const [order, wasCreated] = await Order.upsert({
          shopifyOrderId: orderData.id,
          tenantId,
          customerId,
          orderNumber: orderData.order_number,
          email: orderData.email,
          totalPrice: parseFloat(orderData.total_price),
          subtotalPrice: parseFloat(orderData.subtotal_price),
          totalTax: parseFloat(orderData.total_tax || 0),
          currency: orderData.currency,
          financialStatus: orderData.financial_status,
          fulfillmentStatus: orderData.fulfillment_status,
          gateway: orderData.gateway,
          lineItems: orderData.line_items || [],
          shippingAddress: orderData.shipping_address,
          billingAddress: orderData.billing_address,
          tags: orderData.tags,
          shopifyCreatedAt: orderData.created_at,
          shopifyUpdatedAt: orderData.updated_at
        }, {
          fields: [
            'customerId', 'orderNumber', 'email', 'totalPrice', 'subtotalPrice',
            'totalTax', 'currency', 'financialStatus', 'fulfillmentStatus',
            'gateway', 'lineItems', 'shippingAddress', 'billingAddress',
            'tags', 'shopifyUpdatedAt'
          ]
        });

        wasCreated ? created++ : updated++;
      } catch (error) {
        console.error(`Error syncing order ${orderData.id}:`, error);
      }
    }

    return { created, updated, total: orders.length };
  }

  async syncProducts(tenantId, products) {
    let created = 0, updated = 0;

    for (const productData of products) {
      try {
        const [product, wasCreated] = await Product.upsert({
          shopifyProductId: productData.id,
          tenantId,
          title: productData.title,
          handle: productData.handle,
          description: productData.body_html,
          vendor: productData.vendor,
          productType: productData.product_type,
          status: productData.status,
          tags: productData.tags,
          variants: productData.variants || [],
          images: productData.images || [],
          options: productData.options || [],
          shopifyCreatedAt: productData.created_at,
          shopifyUpdatedAt: productData.updated_at
        }, {
          fields: [
            'title', 'handle', 'description', 'vendor', 'productType',
            'status', 'tags', 'variants', 'images', 'options', 'shopifyUpdatedAt'
          ]
        });

        wasCreated ? created++ : updated++;
      } catch (error) {
        console.error(`Error syncing product ${productData.id}:`, error);
      }
    }

    return { created, updated, total: products.length };
  }
}

module.exports = new SyncService();