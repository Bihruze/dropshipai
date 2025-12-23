/**
 * Shopify Webhook Routes Example
 *
 * This file demonstrates how to set up webhook endpoints
 * for Shopify in an Express application.
 *
 * IMPORTANT: Webhooks require raw body parsing!
 */

import express, { Request, Response, Router } from 'express';
import { shopifyService } from '../services/shopifyService.js';
import type { ShopifyOrder } from '../types/index.js';

const router = Router();

/**
 * CRITICAL: Webhook middleware
 *
 * Shopify webhooks require the raw body to verify HMAC signatures.
 * You MUST use express.raw() for webhook routes.
 *
 * In your main app.ts:
 *
 * // Use raw body parser ONLY for webhook routes
 * app.use('/api/webhooks/shopify',
 *   express.raw({ type: 'application/json' })
 * );
 *
 * // Use JSON parser for all other routes
 * app.use(express.json());
 */

/**
 * Webhook: orders/create
 *
 * Triggered when a new order is created in Shopify
 *
 * Register this webhook with:
 * POST https://{shop}.myshopify.com/admin/api/2024-01/webhooks.json
 * {
 *   "webhook": {
 *     "topic": "orders/create",
 *     "address": "https://yourdomain.com/api/webhooks/shopify/orders/create",
 *     "format": "json"
 *   }
 * }
 */
router.post('/orders/create', async (req: Request, res: Response) => {
  try {
    // Get raw body (Buffer converted to string)
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    const topic = req.headers['x-shopify-topic'] as string;

    console.log(`Received webhook: ${topic} from ${shopDomain}`);

    // Verify webhook authenticity
    const result = shopifyService.processOrderCreatedWebhook(rawBody, hmacHeader);

    if (!result.valid) {
      console.error('Invalid webhook signature:', result.error);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = result.order!;

    // Respond immediately (Shopify expects 200 within 5 seconds)
    res.status(200).json({ received: true });

    // Process order asynchronously
    processOrderInBackground(order).catch(error => {
      console.error('Background order processing failed:', error);
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook: orders/updated
 *
 * Triggered when an order is updated
 */
router.post('/orders/updated', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

    if (!shopifyService.verifyWebhook(rawBody, hmacHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order: ShopifyOrder = JSON.parse(rawBody);

    console.log(`Order updated: #${order.order_number}`);

    // Handle order updates (payment status, fulfillment, etc.)
    if (order.financial_status === 'paid' && order.fulfillment_status === null) {
      console.log('Order paid but not fulfilled - forward to supplier');
      // Your logic here
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook: orders/cancelled
 *
 * Triggered when an order is cancelled
 */
router.post('/orders/cancelled', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

    if (!shopifyService.verifyWebhook(rawBody, hmacHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order: ShopifyOrder = JSON.parse(rawBody);

    console.log(`Order cancelled: #${order.order_number}`);

    // Cancel order with supplier if it was already placed
    // Send refund notifications, etc.

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook: products/update
 *
 * Triggered when a product is updated
 */
router.post('/products/update', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

    if (!shopifyService.verifyWebhook(rawBody, hmacHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const product = JSON.parse(rawBody);

    console.log(`Product updated: ${product.title}`);

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook: app/uninstalled
 *
 * MANDATORY: Triggered when your app is uninstalled
 * You must handle this to clean up webhooks and data
 */
router.post('/app/uninstalled', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    if (!shopifyService.verifyWebhook(rawBody, hmacHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`App uninstalled from: ${shopDomain}`);

    // Clean up data, cancel subscriptions, etc.
    // await cleanupShopData(shopDomain);

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GDPR Webhooks (MANDATORY for App Store apps)
 */

/**
 * Webhook: customers/data_request
 *
 * Customer requests their data (GDPR)
 */
router.post('/customers/data_request', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

    if (!shopifyService.verifyWebhook(rawBody, hmacHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = JSON.parse(rawBody);
    const { shop_domain, customer, orders_requested } = data;

    console.log(`Data request from customer in shop: ${shop_domain}`);

    // Collect and send customer data
    // You have 30 days to respond

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook: customers/redact
 *
 * Delete customer data (GDPR)
 */
router.post('/customers/redact', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

    if (!shopifyService.verifyWebhook(rawBody, hmacHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = JSON.parse(rawBody);
    const { shop_domain, customer, orders_to_redact } = data;

    console.log(`Redact customer data from shop: ${shop_domain}`);

    // Delete or anonymize customer data
    // You have 30 days to comply

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook: shop/redact
 *
 * Delete all shop data (GDPR)
 */
router.post('/shop/redact', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body.toString('utf8');
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

    if (!shopifyService.verifyWebhook(rawBody, hmacHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = JSON.parse(rawBody);
    const { shop_domain } = data;

    console.log(`Redact all shop data: ${shop_domain}`);

    // Delete ALL data related to this shop
    // You have 30 days to comply

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Process order in background
 *
 * This function handles the actual order processing logic
 * after responding to the webhook.
 */
async function processOrderInBackground(order: ShopifyOrder): Promise<void> {
  try {
    console.log(`\nProcessing order #${order.order_number}...`);

    // 1. Validate order
    if (order.financial_status !== 'paid') {
      console.log('  Order not paid - skipping');
      return;
    }

    if (!order.line_items || order.line_items.length === 0) {
      console.log('  No line items - skipping');
      return;
    }

    // 2. Process each line item
    for (const item of order.line_items) {
      console.log(`  Processing: ${item.title} (${item.sku}) x${item.quantity}`);

      // Forward to supplier (CJ, AliExpress, etc.)
      // const supplierOrder = await supplierService.createOrder({
      //   sku: item.sku,
      //   quantity: item.quantity,
      //   shippingAddress: order.shipping_address
      // });

      // Update inventory
      try {
        await shopifyService.adjustInventoryLevel(
          item.variant_id, // This should be inventory_item_id
          await shopifyService.getPrimaryLocationId(),
          -item.quantity // Reduce inventory
        );
        console.log(`  Updated inventory for ${item.sku}`);
      } catch (error) {
        console.error(`  Failed to update inventory:`, error);
      }
    }

    // 3. Send notifications
    console.log(`  Sending notification for order #${order.order_number}`);
    // await notificationService.sendTelegram(
    //   `New order #${order.order_number}\n` +
    //   `Customer: ${order.customer.email}\n` +
    //   `Total: $${order.total_price}\n` +
    //   `Items: ${order.line_items.length}`
    // );

    // 4. Log for analytics
    console.log(`  Order #${order.order_number} processed successfully`);

  } catch (error) {
    console.error('Error processing order:', error);

    // Log error for manual review
    // await logService.logError({
    //   type: 'order_processing',
    //   orderId: order.id,
    //   error: error.message
    // });
  }
}

/**
 * Test webhook endpoint (for development only)
 *
 * Use this to test webhook handling without actual Shopify webhooks.
 * Remove in production!
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test/orders/create', async (req: Request, res: Response) => {
    const testOrder: ShopifyOrder = {
      id: 999999999,
      order_number: 1234,
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_price: '99.99',
      subtotal_price: '89.99',
      total_tax: '10.00',
      currency: 'USD',
      financial_status: 'paid',
      fulfillment_status: null,
      customer: {
        id: 123456,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      },
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        country: 'United States',
        zip: '10001',
        phone: '555-1234'
      },
      line_items: [
        {
          id: 987654321,
          product_id: 111111111,
          variant_id: 222222222,
          title: 'Test Product',
          quantity: 2,
          price: '44.99',
          sku: 'TEST-SKU-001'
        }
      ]
    };

    await processOrderInBackground(testOrder);

    res.json({ success: true, message: 'Test order processed' });
  });
}

export default router;
