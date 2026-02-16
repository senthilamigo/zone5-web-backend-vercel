# Zone5 shop Database Schema Documentation

## Overview

This document describes the PostgreSQL schema design for a scalable fashion eCommerce platform supporting:

- Multi-seller marketplace
- Product variants (size, color, etc.)
- Multi-location inventory (warehouse, exhibitions)
- Festival-based and promotional discounts
- Online and exhibition sales
- Future extensibility using JSONB and flexible modeling

---

# 1. Core Design Principles

- **Product ≠ Variant**
- Inventory tracked at **variant level**
- Discounts are **data-driven**
- Multi-channel support (online + exhibitions)
- Flexible attributes using `JSONB`
- Time-bound entities (offers, festivals)

---

**2. User & Seller Domain**

**2.1 users**

Stores customers, sellers, and admins.

```SQL
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('customer', 'seller', 'admin')),
    created_at TIMESTAMP DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);
```

**2.2 sellers**

Represents brands or merchants.

```SQL
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    brand_name TEXT NOT NULL,
    description TEXT,
    gst_number TEXT,
    created_at TIMESTAMP DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);
```
**3. Product Catalog Domain**

**3.1 products**

Represents the design or style level.

```SQL
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES sellers(id),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID,
    gender TEXT CHECK (gender IN ('men','women','kids','unisex')),
    created_at TIMESTAMP DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);
```
**Purpose**

-   Product discovery

-   SEO & marketing

-   Shared description across variants

**3.2 product_variants**

Represents purchasable units (size, color, SKU).

```SQL
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    sku TEXT UNIQUE NOT NULL,
    color TEXT,
    size TEXT,
    material TEXT,
    attributes JSONB,
    base_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);
```
**Why Variants?**

Inventory, pricing, and ordering operate at this level.

**4. Inventory Domain**

**4.1 inventory_locations**

Represents warehouses, exhibitions, or stores.

```SQL
CREATE TABLE inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('warehouse','exhibition','store')),
    name TEXT,
    city TEXT,
    metadata JSONB
);
```

**4.2 inventory**

Tracks stock per variant per location.

```SQL
CREATE TABLE inventory (\
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\
variant_id UUID REFERENCES product_variants(id),\
location_id UUID REFERENCES inventory_locations(id),\
quantity INT NOT NULL,\
updated_at TIMESTAMP DEFAULT now(),\
UNIQUE (variant_id, location_id)\
);
```

**Design Rationale**

-   Prevents overselling
-   Supports exhibition-specific stock
-   Enables multi-warehouse setup

**5. Exhibition Domain**

**5.1 exhibitions**

```SQL
CREATE TABLE exhibitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    city TEXT,
    start_date DATE,
    end_date DATE,
    organizer TEXT
);
```

**5.2 exhibition_stalls**

```SQL
CREATE TABLE exhibition_stalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exhibition_id UUID REFERENCES exhibitions(id),
    seller_id UUID REFERENCES sellers(id),
    stall_number TEXT
);
```

**Purpose**

-   Track seller participation
-   Enable exhibition-based sales reporting

**6. Festival & Discount Domain**

**6.1 festivals**

```SQL
CREATE TABLE festivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    start_date DATE,
    end_date DATE,
    region TEXT
);
```

**6.2 discounts**

Flexible discount system.

```SQL
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage','flat')),
    discount_value NUMERIC(10,2),
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    applies_to TEXT CHECK (
        applies_to IN ('product','variant','category','seller','festival')
    ),
    reference_id UUID,
    min_order_value NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true
);
```

**Supported Scenarios**

-   Festival sales
-   Seller-wide discount
-   Product clearance
-   Variant-specific markdown
-   Minimum order promotions

**7. Order Domain**

**7.1 orders**

Supports online and exhibition orders.

```SQL
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES sellers(id),
    order_source TEXT CHECK (order_source IN ('online','exhibition')),
    exhibition_id UUID REFERENCES exhibitions(id),
    total_amount NUMERIC(10,2),
    discount_amount NUMERIC(10,2),
    final_amount NUMERIC(10,2),
    status TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

**7.2 order_items**

```SQL
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INT,
    price NUMERIC(10,2),
    discount NUMERIC(10,2)
);
```

**Important**

Orders reference **variants**, not products.

**8. Payment Domain**

```SQL
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    payment_method TEXT,
    payment_status TEXT,
    transaction_ref TEXT,
    paid_at TIMESTAMP
);
```

**9. Reviews & Ratings**

```SQL
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    user_id UUID REFERENCES users(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

**10. Recommended Indexes**

```SQL
CREATE INDEX idx_products_seller ON products(seller_id);\
CREATE INDEX idx_variants_product ON product_variants(product_id);\
CREATE INDEX idx_inventory_variant ON inventory(variant_id);\
CREATE INDEX idx_orders_user ON orders(user_id);\
CREATE INDEX idx_orders_created_at ON orders(created_at);\
CREATE INDEX idx_discounts_validity ON discounts(valid_from, valid_to);
```
