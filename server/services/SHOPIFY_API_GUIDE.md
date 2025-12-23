# Shopify Admin API Service - Complete Guide

## Overview

This service provides a comprehensive TypeScript interface for the Shopify Admin REST API (version 2024-01) optimized for dropshipping applications.

## Features

- **Orders Management**: Fetch orders with pagination and filtering
- **Products Management**: Create, update, delete products
- **Inventory Sync**: Update inventory levels by SKU or inventory item ID
- **Webhook Handling**: Verify HMAC signatures and process webhooks
- **Rate Limiting**: Automatic retry with exponential backoff
- **Error Handling**: Comprehensive error messages and recovery
- **TypeScript**: Full type safety with interfaces

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Required
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-01

# Optional (for webhooks)
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
```

### 2. Get Access Token

#### For Custom Apps:

1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps"
3. Create a custom app
4. Configure Admin API scopes:
   - `read_orders` - Fetch orders
   - `write_products` - Create/update products
   - `read_products` - Read product data
   - `write_inventory` - Update inventory
   - `read_inventory` - Read inventory
5. Install the app and copy the Admin API access token (starts with `shpat_`)

### 3. Import the Service

```typescript
import { shopifyService } from './services/shopifyService.js';
```

## API Documentation

### Orders

#### Get Orders

Fetch orders with pagination and filtering.

```typescript
const orders = await shopifyService.getOrders({
  limit: 50,                              // Max 250
  status: 'any',                          // 'open' | 'closed' | 'cancelled' | 'any'
  financial_status: 'paid',               // Payment status filter
  fulfillment_status: 'unfulfilled',      // Fulfillment status filter
  created_at_min: '2024-01-01T00:00:00Z', // Start date
  created_at_max: '2024-12-31T23:59:59Z', // End date
  since_id: 123456789                     // Pagination cursor
});

// Response
{
  success: true,
  data: ShopifyOrder[],
  pagination: {
    page: 1,
    limit: 50,
    total: 150,
    totalPages: 3
  }
}
```

#### Get Single Order

```typescript
const order = await shopifyService.getOrder(123456789);

// Returns ShopifyOrder object
{
  id: 123456789,
  order_number: 1234,
  email: 'customer@example.com',
  total_price: '99.99',
  financial_status: 'paid',
  fulfillment_status: 'unfulfilled',
  line_items: [...],
  customer: {...},
  shipping_address: {...}
}
```

#### Get Order Count

```typescript
const count = await shopifyService.getOrdersCount({
  status: 'open',
  financial_status: 'paid'
});
```

### Products

#### Get Products

```typescript
const products = await shopifyService.getProducts({
  limit: 100,
  vendor: 'MySupplier',
  product_type: 'Electronics',
  since_id: 123456789
});
```

#### Get Single Product

```typescript
const product = await shopifyService.getProduct(123456789);
```

#### Create Product

```typescript
const newProduct = await shopifyService.createProduct({
  title: 'Wireless Headphones',
  body_html: '<p>High-quality wireless headphones</p>',
  vendor: 'TechSupplier',
  product_type: 'Electronics',
  tags: 'audio,wireless',
  variants: [
    {
      title: 'Black',
      price: '99.99',
      sku: 'WH-001-BLK',
      inventory_quantity: 50,
      compare_at_price: '149.99'
    },
    {
      title: 'White',
      price: '99.99',
      sku: 'WH-001-WHT',
      inventory_quantity: 30
    }
  ],
  images: [
    {
      src: 'https://example.com/image.jpg',
      alt: 'Wireless Headphones'
    }
  ]
});
```

#### Update Product

```typescript
const updated = await shopifyService.updateProduct(123456789, {
  title: 'Updated Product Name',
  tags: 'sale,clearance'
});
```

#### Delete Product

```typescript
await shopifyService.deleteProduct(123456789);
```

### Inventory

#### Get Locations

```typescript
const locations = await shopifyService.getLocations();
// Returns: [{ id: 123, name: 'Main Warehouse', active: true }]
```

#### Get Primary Location

```typescript
const locationId = await shopifyService.getPrimaryLocationId();
```

#### Set Inventory Level (Absolute)

```typescript
// Set inventory to exactly 100 units
const result = await shopifyService.setInventoryLevel(
  inventoryItemId,  // Get from variant.inventory_item_id
  locationId,
  100               // New quantity
);
```

#### Adjust Inventory Level (Relative)

```typescript
// Add 10 units
await shopifyService.adjustInventoryLevel(inventoryItemId, locationId, 10);

// Remove 5 units
await shopifyService.adjustInventoryLevel(inventoryItemId, locationId, -5);
```

#### Update Inventory by SKU

Convenience method that automatically looks up the variant and inventory item.

```typescript
await shopifyService.updateInventoryBySku('WH-001-BLK', 75);
```

#### Bulk Inventory Sync

Perfect for dropshipping - sync inventory from supplier feed.

```typescript
const result = await shopifyService.syncInventory([
  { sku: 'WH-001-BLK', quantity: 100 },
  { sku: 'WH-001-WHT', quantity: 85 },
  { sku: 'KB-002-RED', quantity: 45 },
  { sku: 'MS-003-BLU', quantity: 0 }
]);

// Response shows success/failure for each SKU
{
  success: true,
  data: [
    { sku: 'WH-001-BLK', success: true },
    { sku: 'WH-001-WHT', success: true },
    { sku: 'KB-002-RED', success: true },
    { sku: 'MS-003-BLU', success: false, error: 'Variant not found' }
  ],
  message: 'Some inventory items failed to sync'
}
```

### Webhooks

#### Register Webhook

```typescript
const webhook = await shopifyService.registerWebhook({
  topic: 'orders/create',
  address: 'https://yourdomain.com/api/webhooks/shopify/orders/create',
  format: 'json'
});
```

**Available Topics:**
- `orders/create` - New order created
- `orders/updated` - Order updated
- `orders/cancelled` - Order cancelled
- `orders/fulfilled` - Order fulfilled
- `orders/paid` - Order paid
- `products/create` - Product created
- `products/update` - Product updated
- `products/delete` - Product deleted
- `app/uninstalled` - App uninstalled (MANDATORY)
- `customers/data_request` - GDPR data request (MANDATORY)
- `customers/redact` - GDPR delete request (MANDATORY)
- `shop/redact` - GDPR shop deletion (MANDATORY)

#### Get All Webhooks

```typescript
const webhooks = await shopifyService.getWebhooks();
```

#### Delete Webhook

```typescript
await shopifyService.deleteWebhook(123456789);
```

#### Verify Webhook (HMAC)

```typescript
// In your webhook route handler
const isValid = shopifyService.verifyWebhook(
  rawBody,    // Raw request body as string
  hmacHeader  // X-Shopify-Hmac-Sha256 header
);

if (!isValid) {
  return res.status(401).send('Unauthorized');
}
```

#### Process Order Webhook

Convenience method that verifies and parses:

```typescript
const result = shopifyService.processOrderCreatedWebhook(rawBody, hmacHeader);

if (result.valid) {
  const order = result.order;
  // Process order...
} else {
  console.error(result.error);
}
```

## Webhook Implementation Guide

### 1. Setup Raw Body Parser

**CRITICAL**: Webhooks require raw body to verify HMAC.

```typescript
// app.ts
import express from 'express';

const app = express();

// Raw body parser for webhooks ONLY
app.use('/api/webhooks/shopify',
  express.raw({ type: 'application/json' })
);

// JSON parser for all other routes
app.use(express.json());
```

### 2. Create Webhook Handler

```typescript
// routes/shopifyWebhooks.ts
import { Router } from 'express';
import { shopifyService } from '../services/shopifyService.js';

const router = Router();

router.post('/orders/create', async (req, res) => {
  try {
    // Convert Buffer to string
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

    // Verify webhook
    const result = shopifyService.processOrderCreatedWebhook(rawBody, hmacHeader);

    if (!result.valid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Respond quickly (< 5 seconds)
    res.status(200).json({ received: true });

    // Process order in background
    const order = result.order!;
    processOrder(order).catch(console.error);

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
```

### 3. Mount Router

```typescript
// app.ts
import shopifyWebhooks from './routes/shopifyWebhooks.js';

app.use('/api/webhooks/shopify', shopifyWebhooks);
```

### 4. Register Webhooks

```typescript
// Run once during setup
await shopifyService.registerWebhook({
  topic: 'orders/create',
  address: 'https://yourdomain.com/api/webhooks/shopify/orders/create',
  format: 'json'
});
```

## Rate Limiting

The service automatically handles Shopify's rate limits:

- **Default**: 40 requests per minute (2 per second)
- **Shopify Plus**: 400 requests per minute (20 per second)

**How it works:**
1. Automatic spacing of requests (500ms minimum interval)
2. Detects 429 errors and retries with exponential backoff
3. Parses `X-Shopify-Shop-Api-Call-Limit` header
4. Respects `Retry-After` header
5. Maximum 3 retries before failing

**You don't need to do anything** - just call the API normally!

## Error Handling

All methods throw errors that you should catch:

```typescript
try {
  const product = await shopifyService.getProduct(123);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('404')) {
      console.error('Product not found');
    } else if (error.message.includes('401')) {
      console.error('Authentication failed - check access token');
    } else if (error.message.includes('Rate limit')) {
      console.error('Hit rate limit after retries');
    } else {
      console.error('API error:', error.message);
    }
  }
}
```

## Common Use Cases

### 1. Daily Inventory Sync

```typescript
// Run as a cron job daily
async function syncInventoryFromSupplier() {
  const supplierFeed = await fetchSupplierInventory();

  const items = supplierFeed.map(item => ({
    sku: item.sku,
    quantity: item.stock
  }));

  const result = await shopifyService.syncInventory(items);

  console.log(`Synced ${items.length} items`);

  // Log failures
  const failed = result.data?.filter(r => !r.success);
  if (failed && failed.length > 0) {
    console.error('Failed to sync:', failed);
  }
}
```

### 2. Process New Orders

```typescript
// Check for new orders every 5 minutes
async function processNewOrders() {
  const orders = await shopifyService.getOrders({
    financial_status: 'paid',
    fulfillment_status: 'unfulfilled',
    limit: 50
  });

  for (const order of orders.data || []) {
    // Forward to supplier
    await forwardOrderToSupplier(order);

    // Send notification
    await sendTelegramNotification(
      `New order #${order.order_number}: $${order.total_price}`
    );
  }
}
```

### 3. Import Products from Supplier

```typescript
async function importProduct(supplierProduct) {
  const shopifyProduct = {
    title: supplierProduct.name,
    body_html: supplierProduct.description,
    vendor: 'MySupplier',
    product_type: supplierProduct.category,
    tags: supplierProduct.tags.join(','),
    variants: supplierProduct.variants.map(v => ({
      title: v.name,
      price: (v.cost * 2).toFixed(2), // 100% markup
      sku: v.sku,
      inventory_quantity: v.stock,
      compare_at_price: (v.cost * 2.5).toFixed(2) // Show savings
    })),
    images: supplierProduct.images.map(img => ({
      src: img.url,
      alt: img.alt
    }))
  };

  const created = await shopifyService.createProduct(shopifyProduct);
  console.log(`Imported: ${created.title}`);
}
```

## API Endpoints Reference

### Base URL Format

```
https://{store}.myshopify.com/admin/api/{version}/{resource}.json
```

### Key Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders.json` | GET | List orders |
| `/orders/{id}.json` | GET | Get single order |
| `/orders/count.json` | GET | Count orders |
| `/products.json` | GET/POST | List/create products |
| `/products/{id}.json` | GET/PUT/DELETE | Get/update/delete product |
| `/products/count.json` | GET | Count products |
| `/locations.json` | GET | List locations |
| `/variants/{id}.json` | GET | Get variant details |
| `/inventory_levels.json` | GET | Get inventory levels |
| `/inventory_levels/set.json` | POST | Set inventory (absolute) |
| `/inventory_levels/adjust.json` | POST | Adjust inventory (relative) |
| `/webhooks.json` | GET/POST | List/create webhooks |
| `/webhooks/{id}.json` | DELETE | Delete webhook |

## Important Notes

### API Version

- Using **2024-01** (stable)
- Each version supported for 12 months minimum
- Update API version in `.env` when upgrading

### REST API Deprecation

As of October 1, 2024, the REST Admin API is legacy. New apps should use GraphQL Admin API. However, REST is still supported and works well for dropshipping use cases.

### Access Scopes

Minimum required scopes:
- `read_orders` - Fetch orders
- `write_products` - Manage products
- `read_products` - View products
- `write_inventory` - Update inventory
- `read_inventory` - View inventory

Protected customer data requires additional approval from Shopify.

### Pagination

- Maximum `limit` per request: 250
- Use `since_id` for cursor-based pagination
- Use `created_at_min`/`created_at_max` for date ranges

### Testing

1. Use Shopify's development stores (free)
2. Test with ngrok for webhooks: `ngrok http 3001`
3. Register webhook with ngrok URL
4. Create test orders in Shopify admin

## Troubleshooting

### "Missing required environment variables"
- Check `.env` file has `SHOPIFY_STORE_URL` and `SHOPIFY_ACCESS_TOKEN`
- Make sure to restart server after adding env vars

### "401 Unauthorized"
- Verify access token is correct (starts with `shpat_`)
- Check that required scopes are enabled in custom app
- Token might be revoked - generate a new one

### "429 Rate Limit Exceeded"
- Service automatically retries up to 3 times
- If still failing, you're making too many requests
- Consider batching operations or adding delays

### "Variant with SKU not found"
- SKU must match exactly (case-sensitive)
- Check that product exists in Shopify
- Use `getProducts()` to list all SKUs

### Webhooks not working
- Verify webhook URL is publicly accessible
- Check that raw body parser is configured correctly
- Test HMAC verification with `SHOPIFY_WEBHOOK_SECRET`
- View webhook delivery attempts in Shopify admin

## References

- [Shopify Admin REST API Documentation](https://shopify.dev/docs/api/admin-rest)
- [2024-01 Release Notes](https://shopify.dev/docs/api/release-notes/2024-01)
- [Order API](https://shopify.dev/docs/api/admin-rest/latest/resources/order)
- [Product API](https://shopify.dev/docs/api/admin-rest/latest/resources/product)
- [InventoryLevel API](https://shopify.dev/docs/api/admin-rest/latest/resources/inventorylevel)
- [Webhook API](https://shopify.dev/docs/api/admin-rest/latest/resources/webhook)
- [API Rate Limits](https://shopify.dev/docs/api/admin-rest/usage/rate-limits)
- [Access Scopes](https://shopify.dev/docs/api/usage/access-scopes)

## Support

For issues with this service, check:
1. Environment variables are set correctly
2. Access token has required scopes
3. API version is supported (2024-01 or later)
4. Network connectivity to Shopify
5. Rate limits not exceeded

---

Built for dropshipping applications with production-ready features including rate limiting, error handling, retry logic, and comprehensive TypeScript types.
