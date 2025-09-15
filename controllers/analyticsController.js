const { Customer, Order, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

const analyticsController = {
  // Get dashboard overview
  async getDashboardOverview(req, res) {
    try {
      const tenantId = req.tenantId;

      const [
        totalCustomers,
        totalOrders,
        totalProducts,
        totalRevenue,
        recentOrders
      ] = await Promise.all([
        Customer.count({ where: { tenantId } }),
        Order.count({ where: { tenantId } }),
        Product.count({ where: { tenantId } }),
        Order.sum('totalPrice', { where: { tenantId } }),
        Order.findAll({
          where: { tenantId },
          include: [{ model: Customer, attributes: ['firstName', 'lastName', 'email'] }],
          order: [['shopifyCreatedAt', 'DESC']],
          limit: 10
        })
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalCustomers,
            totalOrders,
            totalProducts,
            totalRevenue: parseFloat(totalRevenue || 0)
          },
          recentOrders
        }
      });
    } catch (error) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get orders by date with filtering
  async getOrdersByDate(req, res) {
    try {
      const tenantId = req.tenantId;
      const { startDate, endDate } = req.query;

      let whereClause = { tenantId };
      
      if (startDate && endDate) {
        whereClause.shopifyCreatedAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const ordersByDate = await Order.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('shopifyCreatedAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
        ],
        group: [sequelize.fn('DATE', sequelize.col('shopifyCreatedAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('shopifyCreatedAt')), 'ASC']]
      });

      res.json({
        success: true,
        data: ordersByDate.map(item => ({
          date: item.dataValues.date,
          orderCount: parseInt(item.dataValues.orderCount),
          totalRevenue: parseFloat(item.dataValues.totalRevenue || 0)
        }))
      });
    } catch (error) {
      console.error('Orders by date error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get top customers by spend
  async getTopCustomers(req, res) {
    try {
      const tenantId = req.tenantId;
      const { limit = 5 } = req.query;

      const topCustomers = await Customer.findAll({
        where: { tenantId },
        attributes: ['id', 'firstName', 'lastName', 'email', 'totalSpent', 'ordersCount'],
        order: [['totalSpent', 'DESC']],
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: topCustomers
      });
    } catch (error) {
      console.error('Top customers error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get revenue trends
  async getRevenueTrends(req, res) {
    try {
      const tenantId = req.tenantId;
      const { period = '30' } = req.query; // days

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const revenueTrends = await Order.findAll({
        where: {
          tenantId,
          shopifyCreatedAt: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('shopifyCreatedAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
        ],
        group: [sequelize.fn('DATE', sequelize.col('shopifyCreatedAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('shopifyCreatedAt')), 'ASC']]
      });

      res.json({
        success: true,
        data: revenueTrends.map(item => ({
          date: item.dataValues.date,
          revenue: parseFloat(item.dataValues.revenue || 0),
          orderCount: parseInt(item.dataValues.orderCount)
        }))
      });
    } catch (error) {
      console.error('Revenue trends error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = analyticsController;