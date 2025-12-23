/**
 * Shopify Service Usage Examples
 *
 * This file demonstrates how to use the Shopify API service
 * for common dropshipping operations.
 */

import { shopifyService } from './shopifyService.js';
import type { ShopifyOrder, ShopifyProduct } from '../types/index.js';

// ==================== ORDERS ====================

/**
 * Example 1: Fetch recent orders
 */
async function fetchRecentOrders() {
  try {
    const orders = await shopifyService.getOrders({
      limit: 50,
      status: 'any',
      financial_status: 'paid',
      fulfillment_status: 'unfulfilled'
    });

    console.log(`Found ${orders.pagination.total} orders`);

    for (const order of orders.data || []) {
      console.log(`Order #${order.order_number}: $${order.total_price}`);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}

/**
 * Example 2: Get orders from a specific date range
 */
async function fetchOrdersByDateRange() {
  try {
    const orders = await shopifyService.getOrders({
      created_at_min: '2024-01-01T00:00:00Z',
      created_at_max: '2024-12-31T23:59:59Z',
      limit: 250
    });

    console.log(`Found ${orders.data?.length} orders in date range`);
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}

/**
 * Example 3: Get a specific order by ID
 */
async function fetchOrderById(orderId: number) {
  try {
    const order = await shopifyService.getOrder(orderId);

    console.log(`Order #${order.order_number}`);
    console.log(`Customer: ${order.customer.first_name} ${order.customer.last_name}`);
    console.log(`Total: $${order.total_price}`);
    console.log(`Items: ${order.line_items.length}`);

    for (const item of order.line_items) {
      console.log(`  - ${item.title} x${item.quantity} @ $${item.price}`);
    }
  } catch (error) {
    console.error('Error fetching order:', error);
  }
}

// ==================== PRODUCTS ====================

/**
 * Example 4: Create a new product
 */
async function createNewProduct() {
  try {
    const newProduct: ShopifyProduct = {
      title: 'Premium Wireless Headphones',
      body_html: '<p>High-quality wireless headphones with noise cancellation</p>',
      vendor: 'TechSupplier',
      product_type: 'Electronics',
      tags: 'audio,wireless,electronics',
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
          inventory_quantity: 30,
          compare_at_price: '149.99'
        }
      ],
      images: [
        {
          src: 'https://example.com/headphones-black.jpg',
          alt: 'Black Wireless Headphones'
        },
        {
          src: 'https://example.com/headphones-white.jpg',
          alt: 'White Wireless Headphones'
        }
      ]
    };

    const createdProduct = await shopifyService.createProduct(newProduct);
    console.log(`Created product #${createdProduct.id}: ${createdProduct.title}`);
  } catch (error) {
    console.error('Error creating product:', error);
  }
}

/**
 * Example 5: Update an existing product
 */
async function updateProductPrice(productId: number) {
  try {
    const updatedProduct = await shopifyService.updateProduct(productId, {
      tags: 'sale,clearance,electronics',
      variants: [
        {
          id: 123456789, // Variant ID
          title: 'Black',
          price: '79.99', // Updated price
          sku: 'WH-001-BLK',
          inventory_quantity: 50
        }
      ]
    });

    console.log(`Updated product: ${updatedProduct.title}`);
  } catch (error) {
    console.error('Error updating product:', error);
  }
}

/**
 * Example 6: Get all products
 */
async function fetchAllProducts() {
  try {
    const products = await shopifyService.getProducts({
      limit: 100,
      vendor: 'TechSupplier'
    });

    console.log(`Found ${products.pagination.total} products`);

    for (const product of products.data || []) {
      console.log(`${product.title} - ${product.variants.length} variants`);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

// ==================== INVENTORY ====================

/**
 * Example 7: Update inventory by SKU
 */
async function updateProductInventory() {
  try {
    const result = await shopifyService.updateInventoryBySku('WH-001-BLK', 75);
    console.log(`Updated inventory: ${result.available} units available`);
  } catch (error) {
    console.error('Error updating inventory:', error);
  }
}

/**
 * Example 8: Bulk inventory sync (common for dropshipping)
 */
async function syncSupplierInventory() {
  try {
    // Simulated supplier inventory data
    const supplierInventory = [
      { sku: 'WH-001-BLK', quantity: 100 },
      { sku: 'WH-001-WHT', quantity: 85 },
      { sku: 'KB-002-RED', quantity: 45 },
      { sku: 'MS-003-BLU', quantity: 0 }, // Out of stock
    ];

    const result = await shopifyService.syncInventory(supplierInventory);

    console.log(result.message);

    if (result.data) {
      const failed = result.data.filter(r => !r.success);
      if (failed.length > 0) {
        console.log('Failed items:');
        for (const item of failed) {
          console.log(`  - ${item.sku}: ${item.error}`);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing inventory:', error);
  }
}

/**
 * Example 9: Adjust inventory (add/subtract)
 */
async function adjustInventory() {
  try {
    const locationId = await shopifyService.getPrimaryLocationId();
    const inventoryItemId = 123456789; // Get from variant

    // Add 10 units
    await shopifyService.adjustInventoryLevel(inventoryItemId, locationId, 10);
    console.log('Added 10 units to inventory');

    // Remove 5 units
    await shopifyService.adjustInventoryLevel(inventoryItemId, locationId, -5);
    console.log('Removed 5 units from inventory');
  } catch (error) {
    console.error('Error adjusting inventory:', error);
  }
}

// ==================== WEBHOOKS ====================

/**
 * Example 10: Register webhook for new orders
 */
async function registerOrderWebhook() {
  try {
    const webhook = await shopifyService.registerWebhook({
      topic: 'orders/create',
      address: 'https://your-domain.com/api/webhooks/shopify/orders/create',
      format: 'json'
    });

    console.log(`Registered webhook #${webhook.id} for ${webhook.topic}`);
  } catch (error) {
    console.error('Error registering webhook:', error);
  }
}

/**
 * Example 11: Express route handler for webhook
 *
 * IMPORTANT: You need to use raw body parser for webhooks!
 *
 * In your Express app:
 * app.use('/webhooks/shopify', express.raw({ type: 'application/json' }));
 */
import { Request, Response } from 'express';

export async function handleOrderCreatedWebhook(req: Request, res: Response) {
  try {
    // Get raw body (Buffer) and HMAC header
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

    // Verify and parse webhook
    const result = shopifyService.processOrderCreatedWebhook(rawBody, hmacHeader);

    if (!result.valid) {
      console.error('Invalid webhook:', result.error);
      return res.status(401).send('Unauthorized');
    }

    const order = result.order!;
    console.log(`Received new order #${order.order_number}`);

    // Process the order (your dropshipping logic here)
    await processDropshippingOrder(order);

    // Always respond with 200 quickly (process async)
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * Example 12: Process dropshipping order (webhook handler logic)
 */
async function processDropshippingOrder(order: ShopifyOrder) {
  console.log(`Processing order #${order.order_number}`);

  // 1. Check if order is paid
  if (order.financial_status !== 'paid') {
    console.log('Order not paid yet, skipping');
    return;
  }

  // 2. Extract line items
  for (const item of order.line_items) {
    console.log(`Item: ${item.title} (SKU: ${item.sku})`);

    // 3. Forward to supplier (CJ Dropshipping, AliExpress, etc.)
    // await supplierService.createOrder({
    //   sku: item.sku,
    //   quantity: item.quantity,
    //   shipping: order.shipping_address
    // });
  }

  // 4. Send notification (Telegram, email, etc.)
  console.log(`Order forwarded to supplier for fulfillment`);
}

/**
 * Example 13: Get all registered webhooks
 */
async function listWebhooks() {
  try {
    const webhooks = await shopifyService.getWebhooks();

    console.log(`Found ${webhooks.length} webhooks:`);
    for (const webhook of webhooks) {
      console.log(`  - ${webhook.topic}: ${webhook.address}`);
    }
  } catch (error) {
    console.error('Error fetching webhooks:', error);
  }
}

/**
 * Example 14: Delete a webhook
 */
async function removeWebhook(webhookId: number) {
  try {
    await shopifyService.deleteWebhook(webhookId);
    console.log(`Deleted webhook #${webhookId}`);
  } catch (error) {
    console.error('Error deleting webhook:', error);
  }
}

// ==================== COMPLETE DROPSHIPPING WORKFLOW ====================

/**
 * Example 15: Complete dropshipping workflow
 * This demonstrates a typical flow for a dropshipping business
 */
async function completeDropshippingWorkflow() {
  console.log('=== Starting Dropshipping Workflow ===');

  try {
    // Step 1: Import products from supplier
    console.log('\n1. Creating product from supplier catalog...');
    const product = await shopifyService.createProduct({
      title: 'Smart Watch Pro',
      body_html: '<p>Feature-rich smartwatch</p>',
      vendor: 'DropshipSupplier',
      product_type: 'Wearables',
      tags: 'electronics,watch,smart',
      variants: [{
        title: 'Default',
        price: '79.99',
        sku: 'SW-PRO-001',
        inventory_quantity: 100,
        compare_at_price: '129.99'
      }],
      images: [{
        src: 'https://example.com/smartwatch.jpg'
      }]
    });
    console.log(`   Created: ${product.title} (#${product.id})`);

    // Step 2: Set up webhook for new orders
    console.log('\n2. Setting up order webhook...');
    const webhook = await shopifyService.registerWebhook({
      topic: 'orders/create',
      address: 'https://your-app.com/webhooks/orders/create',
      format: 'json'
    });
    console.log(`   Webhook registered: #${webhook.id}`);

    // Step 3: Sync inventory from supplier (daily cron job)
    console.log('\n3. Syncing inventory from supplier...');
    const inventorySync = await shopifyService.syncInventory([
      { sku: 'SW-PRO-001', quantity: 95 },
      { sku: 'WH-001-BLK', quantity: 150 },
    ]);
    console.log(`   ${inventorySync.message}`);

    // Step 4: Fetch pending orders (check for new orders)
    console.log('\n4. Checking for unfulfilled orders...');
    const orders = await shopifyService.getOrders({
      financial_status: 'paid',
      fulfillment_status: 'unfulfilled',
      limit: 50
    });
    console.log(`   Found ${orders.data?.length} orders to process`);

    // Step 5: Process each order
    if (orders.data && orders.data.length > 0) {
      for (const order of orders.data) {
        console.log(`\n5. Processing order #${order.order_number}...`);
        // In real scenario: forward to supplier, update tracking, etc.
        console.log(`   Customer: ${order.customer.email}`);
        console.log(`   Items: ${order.line_items.length}`);
        console.log(`   Total: $${order.total_price}`);
      }
    }

    console.log('\n=== Workflow Complete ===');
  } catch (error) {
    console.error('Workflow error:', error);
  }
}

// ==================== ERROR HANDLING ====================

/**
 * Example 16: Proper error handling with rate limiting
 */
async function robustApiCall() {
  try {
    // The service automatically handles:
    // - Rate limiting (429 errors)
    // - Network retries
    // - Exponential backoff

    const products = await shopifyService.getProducts({ limit: 250 });
    console.log(`Success! Got ${products.data?.length} products`);

  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Rate limit exceeded')) {
        console.error('Hit rate limit after retries');
        // Wait and try again later
      } else if (error.message.includes('401')) {
        console.error('Authentication error - check access token');
      } else if (error.message.includes('404')) {
        console.error('Resource not found');
      } else {
        console.error('API error:', error.message);
      }
    }
  }
}

// Export examples for use
export {
  fetchRecentOrders,
  fetchOrdersByDateRange,
  fetchOrderById,
  createNewProduct,
  updateProductPrice,
  fetchAllProducts,
  updateProductInventory,
  syncSupplierInventory,
  adjustInventory,
  registerOrderWebhook,
  listWebhooks,
  removeWebhook,
  completeDropshippingWorkflow,
  robustApiCall,
};
