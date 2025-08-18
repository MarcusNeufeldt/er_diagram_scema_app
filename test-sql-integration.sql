-- Comprehensive test SQL for advanced constraints integration
-- This tests all the new constraint features we implemented

-- Table with all constraint types
CREATE TABLE users (
  id BIGINT NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  age INTEGER CHECK (age >= 18 AND age <= 120),
  balance DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Table with composite primary key
CREATE TABLE order_items (
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  discount DECIMAL(5,2) DEFAULT 0.00 CHECK (discount >= 0 AND discount <= 100),
  PRIMARY KEY (order_id, product_id)
);

-- Table with various indexes
CREATE TABLE products (
  id BIGINT NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  category_id BIGINT,
  sku VARCHAR(100) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create various indexes
CREATE INDEX idx_products_category ON products (category_id);
CREATE UNIQUE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_price ON products (price);
CREATE INDEX idx_products_active_category ON products (is_active, category_id);
CREATE INDEX idx_products_name_search ON products USING GIN (name);

-- Table demonstrating multiple constraint types
CREATE TABLE transactions (
  id BIGINT NOT NULL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount != 0),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
  reference_code VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- More complex indexes
CREATE UNIQUE INDEX idx_transactions_reference ON transactions (reference_code);
CREATE INDEX idx_transactions_user_date ON transactions (user_id, created_at);
CREATE INDEX idx_transactions_status_type ON transactions (status, transaction_type);
CREATE INDEX idx_transactions_amount_range ON transactions USING BTREE (amount) WHERE amount > 1000;

-- Table with composite primary key and multiple constraints
CREATE TABLE user_permissions (
  user_id BIGINT NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id BIGINT NOT NULL,
  permission VARCHAR(20) NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by BIGINT,
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, resource_type, resource_id)
);

-- Indexes for composite primary key table
CREATE INDEX idx_user_permissions_resource ON user_permissions (resource_type, resource_id);
CREATE INDEX idx_user_permissions_granted_by ON user_permissions (granted_by);
CREATE INDEX idx_user_permissions_active ON user_permissions (is_active) WHERE is_active = true;