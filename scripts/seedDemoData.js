const { Tenant } = require('../models');
const syncService = require('../services/syncService');

async function seedDemoData() {
  try {
    console.log('🌱 Seeding demo data for Shopify Analytics assignment...');

    // List of demo stores
    const demoStores = [
      {
        shopDomain: process.env.DEMO_SHOPIFY_STORE_1,
        accessToken: process.env.DEMO_SHOPIFY_TOKEN_1,
        storeName: 'Shopify Store 1'
      },
      {
        shopDomain: process.env.DEMO_SHOPIFY_STORE_2,
        accessToken: process.env.DEMO_SHOPIFY_TOKEN_2,        
        storeName: 'Shopify Store 2'
      }
    ];

    for (const demo of demoStores) {
      // Check if tenant already exists
      let tenant = await Tenant.findOne({ where: { shopDomain: demo.shopDomain } });
      if (!tenant) {
        tenant = await Tenant.create({
          shopDomain: demo.shopDomain,
          accessToken: demo.accessToken,
          storeName: demo.storeName,
        });
        console.log(`✅ Created tenant: ${tenant.id} (${tenant.storeName})`);
      } else {
        console.log(`ℹ️ Tenant already exists: ${tenant.id} (${tenant.storeName})`);
      }

      // Sync data from Shopify
      console.log(`📥 Syncing data for ${tenant.storeName}...`);
      const syncResults = await syncService.syncTenantData(tenant.id);
      console.log(`   Customers: ${syncResults.customers.created} created, ${syncResults.customers.updated} updated`);
      console.log(`   Orders: ${syncResults.orders.created} created, ${syncResults.orders.updated} updated`);
      console.log(`   Products: ${syncResults.products.created} created, ${syncResults.products.updated} updated`);
    }

    console.log('\n🎉 Demo data seeded successfully for all tenants!');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  const db = require('../models');

  db.sequelize.sync()
    .then(() => seedDemoData())
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedDemoData;
