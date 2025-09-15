module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shopifyOrderId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id'
      }
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    subtotalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    totalTax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    financialStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fulfillmentStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gateway: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lineItems: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shopifyCreatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    shopifyUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['customerId'] },
      { fields: ['shopifyOrderId'] },
      { fields: ['shopifyCreatedAt'] },
      { fields: ['tenantId', 'shopifyOrderId'], unique: true }
    ]
  });

  return Order;
};