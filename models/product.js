module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shopifyProductId: {
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
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    handle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    productType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true
    },
    variants: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    options: {
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
    tableName: 'products',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['shopifyProductId'] },
      { fields: ['handle'] },
      { fields: ['tenantId', 'shopifyProductId'], unique: true }
    ]
  });

  return Product;
};