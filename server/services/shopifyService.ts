import crypto from 'crypto';
import type {
  ShopifyOrder,
  ShopifyProduct,
  ShopifyVariant,
  PaginatedResponse,
  ApiResponse,
} from '../types/index.js';

/**
 * Shopify Admin API Service for Dropshipping Application
 *
 * This service provides a complete interface to the Shopify Admin REST API (2024-01)
 * for managing orders, products, and inventory in a dropshipping context.
 *
 * Features:
 * - Order fetching with pagination
 * - Product creation and updates
 * - Inventory synchronization
 * - Webhook handling with HMAC verification
 * - Rate limiting with automatic retry
 * - Comprehensive error handling
 *
 * Required Environment Variables:
 * - SHOPIFY_STORE_URL: Your store domain (e.g., your-store.myshopify.com)
 * - SHOPIFY_ACCESS_TOKEN: Admin API access token (starts with shpat_)
 * - SHOPIFY_API_VERSION: API version (e.g., 2024-01)
 * - SHOPIFY_WEBHOOK_SECRET: Secret for webhook HMAC verification (optional)
 *
 * Required Access Scopes:
 * - read_orders: Fetch orders
 * - write_products: Create/update products
 * - read_products: Read product data
 * - write_inventory: Update inventory levels
 * - read_inventory: Read inventory data
 */

// Types for API responses
interface ShopifyApiError {
  errors?: Record<string, string[]> | string;
  error?: string;
  message?: string;
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrder[];
}

interface ShopifyProductResponse {
  product: ShopifyProduct;
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
}

interface ShopifyInventoryLevelResponse {
  inventory_level: ShopifyInventoryLevel;
}

interface ShopifyInventoryItem {
  id: number;
  sku: string;
  tracked: boolean;
}

interface ShopifyLocation {
  id: number;
  name: string;
  active: boolean;
}

interface ShopifyLocationsResponse {
  locations: ShopifyLocation[];
}

interface WebhookSubscription {
  id?: number;
  topic: string;
  address: string;
  format: 'json' | 'xml';
}

interface ShopifyWebhookResponse {
  webhook: WebhookSubscription;
}

// Rate limiting configuration
interface RateLimitInfo {
  current: number;
  max: number;
  retryAfter?: number;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
}

class ShopifyApiService {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly webhookSecret?: string;

  // Rate limiting
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // 1 second
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 500; // 500ms between requests (2 per second)

  constructor() {
    const storeUrl = process.env.SHOPIFY_STORE_URL;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!storeUrl || !accessToken) {
      throw new Error(
        'Missing required environment variables: SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN'
      );
    }

    // Remove protocol if present and ensure proper format
    const cleanStoreUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    this.baseUrl = `https://${cleanStoreUrl}/admin/api/${apiVersion}`;
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
    this.webhookSecret = webhookSecret;
  }

  /**
   * Make an authenticated request to the Shopify API with rate limiting and retry logic
   */
  private async makeRequest<T>(
    options: RequestOptions,
    retryCount = 0
  ): Promise<T> {
    const { method, endpoint, body, params } = options;

    // Build URL with query parameters
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();
      url += `?${queryString}`;
    }

    // Rate limiting: ensure minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await this.sleep(this.minRequestInterval - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Parse rate limit headers
      const rateLimitInfo = this.parseRateLimitHeaders(response.headers);

      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        if (retryCount < this.maxRetries) {
          const retryDelay = rateLimitInfo.retryAfter
            ? rateLimitInfo.retryAfter * 1000
            : this.baseRetryDelay * Math.pow(2, retryCount);

          console.warn(
            `Rate limited. Retrying after ${retryDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`
          );

          await this.sleep(retryDelay);
          return this.makeRequest<T>(options, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded. Maximum retries reached.');
        }
      }

      // Handle other error responses
      if (!response.ok) {
        const errorData: ShopifyApiError = await response.json().catch(() => ({}));
        const errorMessage = this.formatErrorMessage(errorData, response.status);
        throw new Error(`Shopify API Error (${response.status}): ${errorMessage}`);
      }

      // Parse and return successful response
      const data: T = await response.json();
      return data;

    } catch (error) {
      // Network errors or fetch failures - retry with exponential backoff
      if (retryCount < this.maxRetries && error instanceof TypeError) {
        const retryDelay = this.baseRetryDelay * Math.pow(2, retryCount);
        console.warn(
          `Network error. Retrying after ${retryDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`
        );
        await this.sleep(retryDelay);
        return this.makeRequest<T>(options, retryCount);
      }

      throw error;
    }
  }

  /**
   * Parse rate limit information from response headers
   */
  private parseRateLimitHeaders(headers: Headers): RateLimitInfo {
    const rateLimitHeader = headers.get('X-Shopify-Shop-Api-Call-Limit');
    const retryAfterHeader = headers.get('Retry-After');

    let current = 0;
    let max = 40;

    if (rateLimitHeader) {
      const [currentStr, maxStr] = rateLimitHeader.split('/');
      current = parseInt(currentStr, 10) || 0;
      max = parseInt(maxStr, 10) || 40;
    }

    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

    return { current, max, retryAfter };
  }

  /**
   * Format error message from Shopify API response
   */
  private formatErrorMessage(error: ShopifyApiError, statusCode: number): string {
    if (typeof error.errors === 'string') {
      return error.errors;
    }

    if (typeof error.errors === 'object') {
      return Object.entries(error.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
    }

    if (error.error) {
      return error.error;
    }

    if (error.message) {
      return error.message;
    }

    return `Request failed with status ${statusCode}`;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== ORDER METHODS ====================

  /**
   * Fetch orders with pagination
   *
   * @param options - Pagination and filtering options
   * @returns Paginated list of orders
   *
   * @example
   * const orders = await shopifyService.getOrders({ limit: 50, status: 'any' });
   */
  async getOrders(options: {
    limit?: number;
    page?: number;
    status?: 'open' | 'closed' | 'cancelled' | 'any';
    financial_status?: 'authorized' | 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'partially_refunded' | 'any';
    fulfillment_status?: 'shipped' | 'partial' | 'unshipped' | 'any' | 'unfulfilled';
    created_at_min?: string;
    created_at_max?: string;
    since_id?: number;
  } = {}): Promise<PaginatedResponse<ShopifyOrder>> {
    const {
      limit = 50,
      page = 1,
      status = 'any',
      financial_status,
      fulfillment_status,
      created_at_min,
      created_at_max,
      since_id,
    } = options;

    // Shopify uses limit parameter (max 250)
    const shopifyLimit = Math.min(limit, 250);

    const params: Record<string, string | number> = {
      limit: shopifyLimit,
      status,
    };

    if (financial_status) params.financial_status = financial_status;
    if (fulfillment_status) params.fulfillment_status = fulfillment_status;
    if (created_at_min) params.created_at_min = created_at_min;
    if (created_at_max) params.created_at_max = created_at_max;
    if (since_id) params.since_id = since_id;

    const response = await this.makeRequest<ShopifyOrdersResponse>({
      method: 'GET',
      endpoint: '/orders.json',
      params,
    });

    // Get total count for pagination
    const countResponse = await this.getOrdersCount({ status, financial_status, fulfillment_status });

    return {
      success: true,
      data: response.orders,
      pagination: {
        page,
        limit: shopifyLimit,
        total: countResponse,
        totalPages: Math.ceil(countResponse / shopifyLimit),
      },
    };
  }

  /**
   * Get count of orders matching criteria
   */
  async getOrdersCount(options: {
    status?: string;
    financial_status?: string;
    fulfillment_status?: string;
  } = {}): Promise<number> {
    const params: Record<string, string> = {};
    if (options.status) params.status = options.status;
    if (options.financial_status) params.financial_status = options.financial_status;
    if (options.fulfillment_status) params.fulfillment_status = options.fulfillment_status;

    const response = await this.makeRequest<{ count: number }>({
      method: 'GET',
      endpoint: '/orders/count.json',
      params,
    });

    return response.count;
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: number): Promise<ShopifyOrder> {
    const response = await this.makeRequest<{ order: ShopifyOrder }>({
      method: 'GET',
      endpoint: `/orders/${orderId}.json`,
    });

    return response.order;
  }

  // ==================== PRODUCT METHODS ====================

  /**
   * Get list of products with pagination
   *
   * @example
   * const products = await shopifyService.getProducts({ limit: 50 });
   */
  async getProducts(options: {
    limit?: number;
    page?: number;
    since_id?: number;
    vendor?: string;
    product_type?: string;
    collection_id?: number;
  } = {}): Promise<PaginatedResponse<ShopifyProduct>> {
    const { limit = 50, page = 1, since_id, vendor, product_type, collection_id } = options;

    const shopifyLimit = Math.min(limit, 250);

    const params: Record<string, string | number> = {
      limit: shopifyLimit,
    };

    if (since_id) params.since_id = since_id;
    if (vendor) params.vendor = vendor;
    if (product_type) params.product_type = product_type;
    if (collection_id) params.collection_id = collection_id;

    const response = await this.makeRequest<ShopifyProductsResponse>({
      method: 'GET',
      endpoint: '/products.json',
      params,
    });

    const countResponse = await this.getProductsCount({ vendor, product_type });

    return {
      success: true,
      data: response.products,
      pagination: {
        page,
        limit: shopifyLimit,
        total: countResponse,
        totalPages: Math.ceil(countResponse / shopifyLimit),
      },
    };
  }

  /**
   * Get count of products
   */
  async getProductsCount(options: {
    vendor?: string;
    product_type?: string;
  } = {}): Promise<number> {
    const params: Record<string, string> = {};
    if (options.vendor) params.vendor = options.vendor;
    if (options.product_type) params.product_type = options.product_type;

    const response = await this.makeRequest<{ count: number }>({
      method: 'GET',
      endpoint: '/products/count.json',
      params,
    });

    return response.count;
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: number): Promise<ShopifyProduct> {
    const response = await this.makeRequest<ShopifyProductResponse>({
      method: 'GET',
      endpoint: `/products/${productId}.json`,
    });

    return response.product;
  }

  /**
   * Create a new product
   *
   * @example
   * const product = await shopifyService.createProduct({
   *   title: 'New Product',
   *   body_html: '<p>Description</p>',
   *   vendor: 'MyVendor',
   *   product_type: 'Apparel',
   *   tags: 'new,trending',
   *   variants: [
   *     { title: 'Default', price: '29.99', sku: 'SKU-001', inventory_quantity: 100 }
   *   ],
   *   images: [{ src: 'https://example.com/image.jpg' }]
   * });
   */
  async createProduct(product: ShopifyProduct): Promise<ShopifyProduct> {
    const response = await this.makeRequest<ShopifyProductResponse>({
      method: 'POST',
      endpoint: '/products.json',
      body: { product },
    });

    return response.product;
  }

  /**
   * Update an existing product
   *
   * @example
   * const updated = await shopifyService.updateProduct(123456789, {
   *   title: 'Updated Product Name',
   *   tags: 'sale,trending'
   * });
   */
  async updateProduct(
    productId: number,
    updates: Partial<ShopifyProduct>
  ): Promise<ShopifyProduct> {
    const response = await this.makeRequest<ShopifyProductResponse>({
      method: 'PUT',
      endpoint: `/products/${productId}.json`,
      body: { product: updates },
    });

    return response.product;
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: number): Promise<void> {
    await this.makeRequest<void>({
      method: 'DELETE',
      endpoint: `/products/${productId}.json`,
    });
  }

  // ==================== INVENTORY METHODS ====================

  /**
   * Get all locations for the shop
   * Required to update inventory levels
   */
  async getLocations(): Promise<ShopifyLocation[]> {
    const response = await this.makeRequest<ShopifyLocationsResponse>({
      method: 'GET',
      endpoint: '/locations.json',
    });

    return response.locations;
  }

  /**
   * Get the primary (first active) location ID
   */
  async getPrimaryLocationId(): Promise<number> {
    const locations = await this.getLocations();
    const primaryLocation = locations.find(loc => loc.active);

    if (!primaryLocation) {
      throw new Error('No active location found');
    }

    return primaryLocation.id;
  }

  /**
   * Get inventory item ID for a variant
   * Note: Each variant has an associated inventory_item_id
   */
  async getInventoryItemId(variantId: number): Promise<number> {
    const response = await this.makeRequest<{ variant: ShopifyVariant & { inventory_item_id: number } }>({
      method: 'GET',
      endpoint: `/variants/${variantId}.json`,
    });

    return response.variant.inventory_item_id;
  }

  /**
   * Get inventory level for an inventory item at a location
   */
  async getInventoryLevel(
    inventoryItemId: number,
    locationId: number
  ): Promise<ShopifyInventoryLevel> {
    const response = await this.makeRequest<{ inventory_levels: ShopifyInventoryLevel[] }>({
      method: 'GET',
      endpoint: '/inventory_levels.json',
      params: {
        inventory_item_ids: inventoryItemId,
        location_ids: locationId,
      },
    });

    if (response.inventory_levels.length === 0) {
      throw new Error('Inventory level not found');
    }

    return response.inventory_levels[0];
  }

  /**
   * Set inventory level (absolute value)
   *
   * @example
   * await shopifyService.setInventoryLevel(123456, 789012, 100);
   */
  async setInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    available: number
  ): Promise<ShopifyInventoryLevel> {
    const response = await this.makeRequest<ShopifyInventoryLevelResponse>({
      method: 'POST',
      endpoint: '/inventory_levels/set.json',
      body: {
        inventory_item_id: inventoryItemId,
        location_id: locationId,
        available,
      },
    });

    return response.inventory_level;
  }

  /**
   * Adjust inventory level (relative change)
   *
   * @example
   * // Add 10 to current inventory
   * await shopifyService.adjustInventoryLevel(123456, 789012, 10);
   *
   * // Subtract 5 from current inventory
   * await shopifyService.adjustInventoryLevel(123456, 789012, -5);
   */
  async adjustInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    adjustment: number
  ): Promise<ShopifyInventoryLevel> {
    const response = await this.makeRequest<ShopifyInventoryLevelResponse>({
      method: 'POST',
      endpoint: '/inventory_levels/adjust.json',
      body: {
        inventory_item_id: inventoryItemId,
        location_id: locationId,
        available_adjustment: adjustment,
      },
    });

    return response.inventory_level;
  }

  /**
   * Update inventory for a product variant by SKU
   * Convenience method that handles location and inventory item lookups
   *
   * @example
   * await shopifyService.updateInventoryBySku('SKU-001', 50);
   */
  async updateInventoryBySku(
    sku: string,
    quantity: number,
    locationId?: number
  ): Promise<ShopifyInventoryLevel> {
    // Get location if not provided
    const locId = locationId || await this.getPrimaryLocationId();

    // Find variant by SKU
    const products = await this.getProducts({ limit: 250 });
    let variant: ShopifyVariant & { inventory_item_id?: number } | undefined;

    for (const product of products.data || []) {
      variant = product.variants.find(v => v.sku === sku);
      if (variant) break;
    }

    if (!variant || !variant.id) {
      throw new Error(`Variant with SKU ${sku} not found`);
    }

    // Get inventory item ID
    const inventoryItemId = variant.inventory_item_id || await this.getInventoryItemId(variant.id);

    // Set inventory level
    return this.setInventoryLevel(inventoryItemId, locId, quantity);
  }

  /**
   * Sync inventory for multiple products
   * Useful for bulk inventory updates from suppliers
   *
   * @example
   * await shopifyService.syncInventory([
   *   { sku: 'SKU-001', quantity: 100 },
   *   { sku: 'SKU-002', quantity: 50 },
   * ]);
   */
  async syncInventory(
    items: Array<{ sku: string; quantity: number }>,
    locationId?: number
  ): Promise<ApiResponse<Array<{ sku: string; success: boolean; error?: string }>>> {
    const locId = locationId || await this.getPrimaryLocationId();
    const results: Array<{ sku: string; success: boolean; error?: string }> = [];

    for (const item of items) {
      try {
        await this.updateInventoryBySku(item.sku, item.quantity, locId);
        results.push({ sku: item.sku, success: true });
      } catch (error) {
        results.push({
          sku: item.sku,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const allSuccessful = results.every(r => r.success);

    return {
      success: allSuccessful,
      data: results,
      message: allSuccessful
        ? 'All inventory items synced successfully'
        : 'Some inventory items failed to sync',
    };
  }

  // ==================== WEBHOOK METHODS ====================

  /**
   * Verify webhook authenticity using HMAC
   *
   * @param body - Raw webhook body (string)
   * @param hmacHeader - HMAC header from request (X-Shopify-Hmac-Sha256)
   * @returns true if webhook is authentic
   *
   * @example
   * app.post('/webhooks/orders/create', (req, res) => {
   *   const hmac = req.headers['x-shopify-hmac-sha256'];
   *   const body = JSON.stringify(req.body); // Use raw body
   *
   *   if (!shopifyService.verifyWebhook(body, hmac)) {
   *     return res.status(401).send('Unauthorized');
   *   }
   *
   *   // Process webhook...
   * });
   */
  verifyWebhook(body: string, hmacHeader: string | undefined): boolean {
    if (!this.webhookSecret) {
      console.warn('SHOPIFY_WEBHOOK_SECRET not set. Skipping webhook verification.');
      return true; // Allow in development, but warn
    }

    if (!hmacHeader) {
      return false;
    }

    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body, 'utf8')
      .digest('base64');

    return hash === hmacHeader;
  }

  /**
   * Register a webhook subscription
   *
   * @example
   * await shopifyService.registerWebhook({
   *   topic: 'orders/create',
   *   address: 'https://yourdomain.com/webhooks/orders/create',
   *   format: 'json'
   * });
   */
  async registerWebhook(webhook: WebhookSubscription): Promise<WebhookSubscription> {
    const response = await this.makeRequest<ShopifyWebhookResponse>({
      method: 'POST',
      endpoint: '/webhooks.json',
      body: { webhook },
    });

    return response.webhook;
  }

  /**
   * Get all webhook subscriptions
   */
  async getWebhooks(): Promise<WebhookSubscription[]> {
    const response = await this.makeRequest<{ webhooks: WebhookSubscription[] }>({
      method: 'GET',
      endpoint: '/webhooks.json',
    });

    return response.webhooks;
  }

  /**
   * Delete a webhook subscription
   */
  async deleteWebhook(webhookId: number): Promise<void> {
    await this.makeRequest<void>({
      method: 'DELETE',
      endpoint: `/webhooks/${webhookId}.json`,
    });
  }

  /**
   * Helper: Process orders/create webhook
   * Returns parsed order data with validation
   */
  processOrderCreatedWebhook(
    body: string,
    hmacHeader: string | undefined
  ): { valid: boolean; order?: ShopifyOrder; error?: string } {
    // Verify webhook
    if (!this.verifyWebhook(body, hmacHeader)) {
      return { valid: false, error: 'Invalid HMAC signature' };
    }

    try {
      const order: ShopifyOrder = JSON.parse(body);
      return { valid: true, order };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to parse webhook body'
      };
    }
  }
}

// Factory function for creating configured instances
export interface ShopifyServiceConfig {
  storeUrl: string;
  accessToken: string;
  apiVersion?: string;
  webhookSecret?: string;
}

export function createShopifyService(config: ShopifyServiceConfig): ConfigurableShopifyService {
  return new ConfigurableShopifyService(config);
}

// Configurable version for multi-tenant use
class ConfigurableShopifyService {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly webhookSecret?: string;

  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 500;

  constructor(config: ShopifyServiceConfig) {
    const { storeUrl, accessToken, apiVersion = '2024-01', webhookSecret } = config;

    if (!storeUrl || !accessToken) {
      throw new Error('Missing required config: storeUrl and accessToken');
    }

    const cleanStoreUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.baseUrl = `https://${cleanStoreUrl}/admin/api/${apiVersion}`;
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
    this.webhookSecret = webhookSecret;
  }

  private async makeRequest<T>(
    options: RequestOptions,
    retryCount = 0
  ): Promise<T> {
    const { method, endpoint, body, params } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();
      url += `?${queryString}`;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await this.sleep(this.minRequestInterval - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const rateLimitInfo = this.parseRateLimitHeaders(response.headers);

      if (response.status === 429) {
        if (retryCount < this.maxRetries) {
          const retryDelay = rateLimitInfo.retryAfter
            ? rateLimitInfo.retryAfter * 1000
            : this.baseRetryDelay * Math.pow(2, retryCount);
          await this.sleep(retryDelay);
          return this.makeRequest<T>(options, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded. Maximum retries reached.');
        }
      }

      if (!response.ok) {
        const errorData: ShopifyApiError = await response.json().catch(() => ({}));
        const errorMessage = this.formatErrorMessage(errorData, response.status);
        throw new Error(`Shopify API Error (${response.status}): ${errorMessage}`);
      }

      const data: T = await response.json();
      return data;

    } catch (error) {
      if (retryCount < this.maxRetries && error instanceof TypeError) {
        const retryDelay = this.baseRetryDelay * Math.pow(2, retryCount);
        await this.sleep(retryDelay);
        return this.makeRequest<T>(options, retryCount);
      }
      throw error;
    }
  }

  private parseRateLimitHeaders(headers: Headers): RateLimitInfo {
    const rateLimitHeader = headers.get('X-Shopify-Shop-Api-Call-Limit');
    const retryAfterHeader = headers.get('Retry-After');

    let current = 0;
    let max = 40;

    if (rateLimitHeader) {
      const [currentStr, maxStr] = rateLimitHeader.split('/');
      current = parseInt(currentStr, 10) || 0;
      max = parseInt(maxStr, 10) || 40;
    }

    return { current, max, retryAfter: retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined };
  }

  private formatErrorMessage(error: ShopifyApiError, statusCode: number): string {
    if (typeof error.errors === 'string') return error.errors;
    if (typeof error.errors === 'object') {
      return Object.entries(error.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
    }
    if (error.error) return error.error;
    if (error.message) return error.message;
    return `Request failed with status ${statusCode}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test connection
  async testConnection(): Promise<ApiResponse<{ shop: string }>> {
    try {
      const response = await this.makeRequest<{ shop: { name: string; domain: string } }>({
        method: 'GET',
        endpoint: '/shop.json',
      });
      return { success: true, data: { shop: response.shop.name } };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  async getOrders(options: {
    limit?: number;
    status?: 'open' | 'closed' | 'cancelled' | 'any';
    fulfillment_status?: 'fulfilled' | 'unfulfilled' | 'partial' | 'any';
  } = {}): Promise<PaginatedResponse<ShopifyOrder>> {
    const { limit = 50, status = 'any', fulfillment_status } = options;
    const params: Record<string, string | number> = { limit: Math.min(limit, 250), status };
    if (fulfillment_status) params.fulfillment_status = fulfillment_status;

    const response = await this.makeRequest<ShopifyOrdersResponse>({
      method: 'GET',
      endpoint: '/orders.json',
      params,
    });

    return { success: true, data: response.orders, pagination: { page: 1, limit, total: response.orders.length, totalPages: 1 } };
  }

  async getOrder(orderId: number): Promise<ShopifyOrder> {
    const response = await this.makeRequest<{ order: ShopifyOrder }>({
      method: 'GET',
      endpoint: `/orders/${orderId}.json`,
    });
    return response.order;
  }

  async fulfillOrder(orderId: number, trackingNumber: string, trackingCompany: string): Promise<ApiResponse<void>> {
    const order = await this.getOrder(orderId);
    const fulfillableItems = order.line_items?.filter(item => item.fulfillable_quantity && item.fulfillable_quantity > 0);

    if (!fulfillableItems || fulfillableItems.length === 0) {
      return { success: false, message: 'No items to fulfill' };
    }

    await this.makeRequest({
      method: 'POST',
      endpoint: `/orders/${orderId}/fulfillments.json`,
      body: {
        fulfillment: {
          tracking_number: trackingNumber,
          tracking_company: trackingCompany,
          line_items: fulfillableItems.map(item => ({ id: item.id })),
        },
      },
    });

    return { success: true };
  }

  async getProducts(options: { limit?: number; status?: 'active' | 'archived' | 'draft' } = {}): Promise<PaginatedResponse<ShopifyProduct>> {
    const { limit = 50, status } = options;
    const params: Record<string, string | number> = { limit: Math.min(limit, 250) };
    if (status) params.status = status;

    const response = await this.makeRequest<ShopifyProductsResponse>({
      method: 'GET',
      endpoint: '/products.json',
      params,
    });

    return { success: true, data: response.products, pagination: { page: 1, limit, total: response.products.length, totalPages: 1 } };
  }

  async createProduct(product: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    const response = await this.makeRequest<ShopifyProductResponse>({
      method: 'POST',
      endpoint: '/products.json',
      body: { product },
    });
    return response.product;
  }

  async updateProduct(productId: number, updates: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    const response = await this.makeRequest<ShopifyProductResponse>({
      method: 'PUT',
      endpoint: `/products/${productId}.json`,
      body: { product: updates },
    });
    return response.product;
  }

  async deleteProduct(productId: number): Promise<ApiResponse<void>> {
    await this.makeRequest<void>({
      method: 'DELETE',
      endpoint: `/products/${productId}.json`,
    });
    return { success: true };
  }

  async updateInventory(inventoryItemId: number, locationId: number, quantity: number): Promise<ApiResponse<void>> {
    await this.makeRequest({
      method: 'POST',
      endpoint: '/inventory_levels/set.json',
      body: { inventory_item_id: inventoryItemId, location_id: locationId, available: quantity },
    });
    return { success: true };
  }

  async getLocations(): Promise<ShopifyLocation[]> {
    const response = await this.makeRequest<ShopifyLocationsResponse>({
      method: 'GET',
      endpoint: '/locations.json',
    });
    return response.locations;
  }

  verifyWebhook(body: string, hmacHeader: string | undefined): boolean {
    if (!this.webhookSecret) {
      console.warn('Webhook secret not set - skipping verification');
      return true;
    }
    if (!hmacHeader) return false;
    const hash = crypto.createHmac('sha256', this.webhookSecret).update(body, 'utf8').digest('base64');
    return hash === hmacHeader;
  }
}

// Export class for testing or custom instances
export default ShopifyApiService;
export { ConfigurableShopifyService };
