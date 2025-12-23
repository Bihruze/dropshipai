# Shopify API - Quick Start Guide

## Setup (5 minutes)

### 1. Create Custom App in Shopify

1. Go to your Shopify Admin
2. Settings → Apps and sales channels → Develop apps
3. Click "Create an app"
4. Name it "Dropship Automation"
5. Configure Admin API scopes:
   ```
   ✓ read_orders
   ✓ write_products
   ✓ read_products
   ✓ write_inventory
   ✓ read_inventory
   ```
6. Install app and copy the **Admin API access token**

### 2. Update Environment Variables

Edit `/Users/seher/Downloads/dropshipai/server/.env`:

```env
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-01
SHOPIFY_WEBHOOK_SECRET=your-secret-here
```

### 3. Test Connection

```typescript
import { shopifyService } from './services/shopifyService.js';

// Test by fetching orders
const orders = await shopifyService.getOrders({ limit: 5 });
console.log(`Connected! Found ${orders.data?.length} orders`);
```

## Common Operations

### Fetch Orders

```typescript
// Get paid, unfulfilled orders
const orders = await shopifyService.getOrders({
  financial_status: 'paid',
  fulfillment_status: 'unfulfilled',
  limit: 50
});

for (const order of orders.data || []) {
  console.log(`Order #${order.order_number}: $${order.total_price}`);
}
```

### Create Product

```typescript
const product = await shopifyService.createProduct({
  title: 'Wireless Mouse',
  body_html: '<p>Ergonomic wireless mouse</p>',
  vendor: 'TechSupplier',
  product_type: 'Electronics',
  tags: 'electronics,computer,wireless',
  variants: [{
    title: 'Black',
    price: '29.99',
    sku: 'MS-001-BLK',
    inventory_quantity: 100
  }],
  images: [{
    src: 'https://example.com/mouse.jpg'
  }]
});
```

### Sync Inventory

```typescript
// Update multiple SKUs at once
const result = await shopifyService.syncInventory([
  { sku: 'MS-001-BLK', quantity: 100 },
  { sku: 'KB-002-WHT', quantity: 75 },
  { sku: 'HD-003-BLU', quantity: 50 }
]);

console.log(result.message);
```

### Setup Webhook

```typescript
// Register webhook for new orders
await shopifyService.registerWebhook({
  topic: 'orders/create',
  address: 'https://yourdomain.com/api/webhooks/shopify/orders/create',
  format: 'json'
});
```

## Webhook Handler

Create `/server/routes/shopifyWebhooks.ts`:

```typescript
import { Router } from 'express';
import { shopifyService } from '../services/shopifyService.js';

const router = Router();

router.post('/orders/create', async (req, res) => {
  const rawBody = req.body.toString('utf8');
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;

  const result = shopifyService.processOrderCreatedWebhook(rawBody, hmac);

  if (!result.valid) {
    return res.status(401).send('Unauthorized');
  }

  const order = result.order!;
  console.log(`New order: #${order.order_number}`);

  // Process order async
  processOrder(order).catch(console.error);

  res.status(200).json({ received: true });
});

export default router;
```

In `app.ts`:

```typescript
// IMPORTANT: Use raw body parser for webhooks!
app.use('/api/webhooks/shopify',
  express.raw({ type: 'application/json' })
);

// Mount routes
import shopifyWebhooks from './routes/shopifyWebhooks.js';
app.use('/api/webhooks/shopify', shopifyWebhooks);
```

## Key Endpoints

| Operation | Code |
|-----------|------|
| Get orders | `shopifyService.getOrders()` |
| Get single order | `shopifyService.getOrder(id)` |
| List products | `shopifyService.getProducts()` |
| Create product | `shopifyService.createProduct(data)` |
| Update product | `shopifyService.updateProduct(id, data)` |
| Update inventory | `shopifyService.updateInventoryBySku(sku, qty)` |
| Bulk sync | `shopifyService.syncInventory(items)` |
| Register webhook | `shopifyService.registerWebhook(config)` |
| Verify webhook | `shopifyService.verifyWebhook(body, hmac)` |

## Files Created

- **`/server/services/shopifyService.ts`** - Main API service
- **`/server/services/shopifyService.example.ts`** - Usage examples
- **`/server/routes/shopifyWebhooks.example.ts`** - Webhook handlers
- **`/server/services/SHOPIFY_API_GUIDE.md`** - Complete documentation

## Features

✅ Automatic rate limiting with retry
✅ Exponential backoff on errors
✅ HMAC webhook verification
✅ TypeScript types
✅ Error handling
✅ Pagination support
✅ Bulk operations

## API Rate Limits

- **Regular stores**: 40 requests/min (2/sec)
- **Shopify Plus**: 400 requests/min (20/sec)

Service automatically handles rate limits with retries!

## Testing

```typescript
// Test connection
const locations = await shopifyService.getLocations();
console.log('Locations:', locations);

// Test orders
const orders = await shopifyService.getOrders({ limit: 1 });
console.log('Recent order:', orders.data?.[0]);

// Test products
const products = await shopifyService.getProducts({ limit: 1 });
console.log('Product:', products.data?.[0]);
```

## Common Issues

### "Missing environment variables"
→ Check `.env` file has `SHOPIFY_STORE_URL` and `SHOPIFY_ACCESS_TOKEN`

### "401 Unauthorized"
→ Verify access token and scopes in Shopify admin

### "429 Rate Limit"
→ Service auto-retries, but you may be making too many requests

### Webhooks not firing
→ Use ngrok for local testing: `ngrok http 3001`

## Next Steps

1. ✅ Setup environment variables
2. ✅ Test connection with `getOrders()`
3. ✅ Create a test product
4. ✅ Setup webhooks with ngrok
5. ✅ Process test order

## Resources

- Full Guide: `/server/services/SHOPIFY_API_GUIDE.md`
- Examples: `/server/services/shopifyService.example.ts`
- Webhook Routes: `/server/routes/shopifyWebhooks.example.ts`
- [Shopify API Docs](https://shopify.dev/docs/api/admin-rest)

---

**Ready to use!** Import and start calling `shopifyService` methods.
