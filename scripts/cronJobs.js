const cron = require('node-cron');
const syncAllTenants = require('./syncShopifyData');

// Sync every hour
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Scheduled sync triggered at:', new Date().toISOString());
  try {
    await syncAllTenants();
  } catch (error) {
    console.error('❌ Scheduled sync failed:', error);
  }
});

console.log('🚀 Cron jobs initialized - syncing every hour');
console.log('📅 Next sync will run at the top of the next hour');