## Shopify Multi Tenant Analytics – Backend (Node.js + Express + PostgreSQL)

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-Backend-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Sequelize](https://img.shields.io/badge/ORM-Sequelize-52B0E7?logo=sequelize&logoColor=white)](https://sequelize.org)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app)

Multi‑tenant Shopify analytics backend. Ingests data from Shopify REST APIs per tenant and exposes analytics endpoints for the frontend dashboard.

### Highlights
- Multi‑tenant isolation using `x-tenant-id` header.
- Shopify ingestion: customers, orders, products.
- Analytics: overview cards, top customers, revenue trends, orders by date.
- Production‑ready security: `helmet`, rate limiting, CORS.
- Works locally and on Railway (managed Postgres).

---

### Architecture

```mermaid
flowchart LR
  subgraph Shopify[Shopify Stores]
    S1[Store A]--REST-->API
    S2[Store B]--REST-->API
  end

  API[Express API]\n/routes, /controllers, /services
  M[tenantMiddleware]\nreads x-tenant-id
  SVC[shopifyService]\naxios client
  SYNC[syncService]\nupsert via Sequelize
  DB[(PostgreSQL)]

  API -- protected --> M
  API -- sync/analytics --> SYNC
  SYNC --> SVC --> Shopify
  M --> DB
  SYNC --> DB
```

---

### Database Schema (Sequelize models → SQL)

```mermaid
erDiagram
  TENANTS ||--o{ CUSTOMERS : has
  TENANTS ||--o{ ORDERS : has
  TENANTS ||--o{ PRODUCTS : has
  CUSTOMERS ||--o{ ORDERS : places

  TENANTS {
    uuid id PK
    string shopDomain UNIQUE
    string storeName
    text accessToken
    boolean isActive
    timestamp lastSyncAt
    jsonb metadata
    timestamp createdAt
    timestamp updatedAt
  }

  CUSTOMERS {
    uuid id PK
    bigint shopifyCustomerId
    uuid tenantId FK
    string email
    string firstName
    string lastName
    string phone
    decimal totalSpent
    int ordersCount
    boolean acceptsMarketing
    string tags
    jsonb addresses
    timestamp shopifyCreatedAt
    timestamp shopifyUpdatedAt
    timestamp createdAt
    timestamp updatedAt
  }

  ORDERS {
    uuid id PK
    bigint shopifyOrderId
    uuid tenantId FK
    uuid customerId FK
    int orderNumber
    string email
    decimal totalPrice
    decimal subtotalPrice
    decimal totalTax
    string currency
    string financialStatus
    string fulfillmentStatus
    string gateway
    jsonb lineItems
    jsonb shippingAddress
    jsonb billingAddress
    string tags
    timestamp shopifyCreatedAt
    timestamp shopifyUpdatedAt
    timestamp createdAt
    timestamp updatedAt
  }

  PRODUCTS {
    uuid id PK
    bigint shopifyProductId
    uuid tenantId FK
    string title
    string handle
    text description
    string vendor
    string productType
    string status
    string tags
    jsonb variants
    jsonb images
    jsonb options
    timestamp shopifyCreatedAt
    timestamp shopifyUpdatedAt
    timestamp createdAt
    timestamp updatedAt
  }
```

Primary indexes defined in the models:
- `tenants(shopDomain)`, `tenants(isActive)`
- `customers(tenantId)`, `customers(shopifyCustomerId)`, `customers(email)`, unique `(tenantId, shopifyCustomerId)`
- `orders(tenantId)`, `orders(customerId)`, `orders(shopifyOrderId)`, `orders(shopifyCreatedAt)`, unique `(tenantId, shopifyOrderId)`
- `products(tenantId)`, `products(shopifyProductId)`, `products(handle)`, unique `(tenantId, shopifyProductId)`

---

### Endpoints

- Health: `GET /health`
- Tenants: `GET /api/tenants`, `GET /api/tenants/:id`, `POST /api/tenants`, `PUT /api/tenants/:id`, `DELETE /api/tenants/:id`
- Sync (requires `x-tenant-id`):
  - `POST /api/sync/trigger`
  - `GET /api/sync/status`
- Analytics (requires `x-tenant-id`):
  - `GET /api/analytics/dashboard`
  - `GET /api/analytics/top-customers?limit=5`
  - `GET /api/analytics/orders-by-date?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
  - `GET /api/analytics/revenue-trends?period=30`

Example curl:
```bash
curl -H "x-tenant-id: <TENANT_UUID>" \
  https://<your-backend-host>/api/analytics/dashboard

curl -X POST -H "Content-Type: application/json" \
  -d '{"shopDomain":"your-store.myshopify.com","accessToken":"shpat_...","storeName":"Your Store"}' \
  https://<your-backend-host>/api/tenants

curl -X POST -H "x-tenant-id: <TENANT_UUID>" \
  https://<your-backend-host>/api/sync/trigger
```

---

### Environment Variables

Backend reads production config from `DATABASE_URL` (SSL on by default). For Railway, set these in Project → Variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
DATABASE_SSL=true
SHOPIFY_API_VERSION=2024-10
FRONTEND_URL=https://<your-frontend>.vercel.app
DB_CONNECT_RETRIES=10
DB_CONNECT_RETRY_DELAY_MS=3000
```

Optional (only if you seed demo data):
```env
DEMO_SHOPIFY_STORE_1=
DEMO_SHOPIFY_TOKEN_1=
DEMO_SHOPIFY_STORE_2=
DEMO_SHOPIFY_TOKEN_2=
```

---

### Local Development

```bash
git clone <repo>
cd xeno_shopify_backend
npm install

# .env (local dev) – use discrete DB_* if not using DATABASE_URL locally
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=xeno_shopify
SHOPIFY_API_VERSION=2024-10
EOF

npm run dev
# visit http://localhost:3000/health
```

Create a tenant and sync:
```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"shopDomain":"your-store.myshopify.com","accessToken":"shpat_...","storeName":"Your Store"}'

curl -X POST http://localhost:3000/api/sync/trigger \
  -H "x-tenant-id: <TENANT_UUID>"
```

---

### Deployment (Railway)

1) Add a Postgres database (note the `DATABASE_URL`).
2) Create a service from this subdirectory.
   - Root Directory: `xeno_shopify_backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
3) Variables (Shared → SHARE to the service): see Environment Variables above.
4) Redeploy and watch logs. Expected:
   - `🔌 DB connect attempt ...` → `✅ Database connected successfully` → `✅ Database synchronized`.

Cron: `node-cron` runs hourly in production (inside `scripts/cronJobs.js`). In serverless environments use scheduled HTTP hits instead.

---

### Security & Observability
- Helmet, CORS with whitelisted origins (`FRONTEND_URL`, localhost, `*.vercel.app`).
- Rate limit on `/api/*` (100 req / 15 min per IP).
- Global error handler returns compact JSON; stack trace in development only.

---

### Table Definitions (DDL snippets)

These are representative SQL snippets equivalent to the Sequelize models.

```sql
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain text UNIQUE NOT NULL,
  store_name text NOT NULL,
  access_token text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tenants_active ON tenants(is_active);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_customer_id bigint NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  phone text,
  total_spent numeric(10,2) DEFAULT 0,
  orders_count int DEFAULT 0,
  accepts_marketing boolean DEFAULT false,
  tags text,
  addresses jsonb DEFAULT '[]'::jsonb,
  shopify_created_at timestamptz,
  shopify_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, shopify_customer_id)
);
CREATE INDEX idx_customers_email ON customers(email);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id bigint NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  order_number int NOT NULL,
  email text,
  total_price numeric(10,2) NOT NULL,
  subtotal_price numeric(10,2) NOT NULL,
  total_tax numeric(10,2) DEFAULT 0,
  currency char(3) DEFAULT 'USD',
  financial_status text,
  fulfillment_status text,
  gateway text,
  line_items jsonb DEFAULT '[]'::jsonb,
  shipping_address jsonb,
  billing_address jsonb,
  tags text,
  shopify_created_at timestamptz NOT NULL,
  shopify_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, shopify_order_id)
);
CREATE INDEX idx_orders_created_at ON orders(shopify_created_at);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_product_id bigint NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  handle text,
  description text,
  vendor text,
  product_type text,
  status text DEFAULT 'active',
  tags text,
  variants jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  options jsonb DEFAULT '[]'::jsonb,
  shopify_created_at timestamptz,
  shopify_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, shopify_product_id)
);
CREATE INDEX idx_products_handle ON products(handle);
```

---

### Development Scripts
- `npm run dev` – start with nodemon
- `npm run seed` – create demo tenants and fetch data (requires valid demo creds)
- `npm run sync` – manual sync all tenants

---

### Troubleshooting
- ECONNREFUSED / timeouts:
  - Verify `DATABASE_URL` is correct and SHARED to the service.
  - Try `DATABASE_SSL=false` if your provider rejects SSL within the same network.
  - Increase: `DB_CONNECT_RETRIES`, `DB_CONNECT_RETRY_DELAY_MS`.
- 404 on endpoints: check base path and that routes are mounted in `server.js`.
- CORS: set `FRONTEND_URL` to your deployed frontend origin.

---

### License
MIT


