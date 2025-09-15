const syncService = require('../services/syncService');
const { Tenant } = require('../models');

async function syncAllTenants() {
  try {
    console.log('🔄 Starting Shopify data sync for all tenants...');
    
    const tenants = await Tenant.findAll({
      where: { isActive: true }
    });

    if (tenants.length === 0) {
      console.log('⚠️  No active tenants found. Run seed script first:');
      console.log('   npm run seed');
      return;
    }

    for (const tenant of tenants) {
      console.log(`\n📡 Syncing tenant: ${tenant.storeName} (${tenant.shopDomain})`);
      
      try {
        const results = await syncService.syncTenantData(tenant.id);
        console.log('✅ Sync completed:', results);
      } catch (error) {
        console.error(`❌ Sync failed for ${tenant.storeName}:`, error.message);
      }
    }

    console.log('\n🎉 All tenant syncs completed!');
    console.log('\n💡 Next steps:');
    console.log('   - Start your Next.js frontend');
    console.log('   - Use tenant IDs from above for API calls');
    console.log('   - Backend running at http://localhost:3000');
  } catch (error) {
    console.error('❌ Error during sync process:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  const db = require('../models');
  
  db.sequelize.sync()
    .then(() => syncAllTenants())
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = syncAllTenants;