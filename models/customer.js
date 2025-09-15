module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shopifyCustomerId: {
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
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    ordersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    acceptsMarketing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true
    },
    addresses: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    shopifyCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shopifyUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['shopifyCustomerId'] },
      { fields: ['email'] },
      { fields: ['tenantId', 'shopifyCustomerId'], unique: true }
    ]
  });

  return Customer;
};