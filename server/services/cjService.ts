/**
 * CJ Dropshipping API Service
 *
 * Production-ready TypeScript service for integrating with CJ Dropshipping API v2.0
 *
 * API Documentation: https://developers.cjdropshipping.com/
 * Base URL: https://developers.cjdropshipping.com/api2.0/v1
 *
 * Features:
 * - Product search and catalog management
 * - Variant details and pricing
 * - Multi-warehouse inventory checking
 * - Order creation and fulfillment
 * - Shipment tracking
 * - Freight calculation
 *
 * Authentication:
 * - Token-based authentication with email and API key
 * - Access token expires in 15 days
 * - Refresh token expires in 180 days
 * - Automatic token refresh before expiration
 *
 * Rate Limits:
 * - Free users: 1000 requests per day
 * - One IP limited to max 3 users
 *
 * Error Handling:
 * - All methods return standardized ApiResponse<T>
 * - Success: HTTP 200 AND (code=200 OR no code field)
 * - Failure: HTTP ≠ 200 OR code field ≠ 200
 *
 * @example
 * const cjService = createCJService({
 *   email: 'your-email@example.com',
 *   apiKey: 'your-api-key'
 * });
 *
 * // Search products
 * const products = await cjService.searchProducts({ keyword: 'phone case' });
 *
 * // Check stock
 * const stock = await cjService.checkStock('variant-id-123', 10, 'US');
 *
 * // Create order
 * const order = await cjService.createOrder({
 *   orderNumber: 'ORDER-123',
 *   shippingCountryCode: 'US',
 *   // ... other fields
 * });
 *
 * // Track shipment
 * const tracking = await cjService.getTracking('TRACKING-NUMBER');
 */

import { apiRequest, buildQueryString } from '../utils/apiClient.js';
import type {
  CJProduct,
  CJOrderCreate,
  CJOrderResponse,
  ApiResponse,
  PaginatedResponse,
} from '../types/index.js';

interface CJConfig {
  email: string;
  apiKey: string;
}

interface CJApiResponse<T> {
  code: number;
  result: boolean;
  message: string;
  data: T;
}

interface CJAuthResponse {
  code: number;
  result: boolean;
  message: string;
  data: {
    accessToken: string;
    accessTokenExpiryDate: string;
    refreshToken: string;
    refreshTokenExpiryDate: string;
    createDate: string;
  };
}

// Extended Product Types
export interface CJVariant {
  vid: string;
  pid: string;
  variantNameEn: string;
  variantName?: string;
  variantSku: string;
  variantImage?: string;
  variantSellPrice: number;
  variantKey?: string;
  variantWeight?: number;
  variantLength?: number;
  variantWidth?: number;
  variantHeight?: number;
  variantVolume?: number;
}

export interface CJProductDetail extends CJProduct {
  variants: CJVariant[];
  productImages?: string[];
  description?: string;
  descriptionEn?: string;
  packingWeight?: number;
  packingVolume?: number;
}

export interface CJCategory {
  categoryId: string;
  categoryName: string;
  categoryNameEn: string;
  parentId?: string;
  level?: number;
}

// Inventory Types
export interface CJInventory {
  vid?: string;
  pid?: string;
  areaId: number;
  areaEn: string;
  countryCode: string;
  countryNameEn: string;
  totalInventoryNum: number;
  cjInventoryNum: number;
  factoryInventoryNum: number;
  storageNum?: number;
}

// Order Types
export interface CJOrder {
  orderId: string;
  orderNum: string;
  cjOrderId: string;
  orderNumber: string;
  orderStatus: string;
  orderAmount: number;
  productAmount: number;
  postageAmount: number;
  orderWeight: number;
  createDate: string;
  paymentDate?: string;
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingCustomerName: string;
  shippingPhone: string;
  trackNumber?: string;
  logisticName?: string;
  productList?: Array<{
    vid: string;
    productName: string;
    variantName: string;
    quantity: number;
    sellPrice: number;
  }>;
}

// Tracking Types
export interface CJTrackingInfo {
  trackingNumber: string;
  logisticName: string;
  trackingFrom: string;
  trackingTo: string;
  deliveryDay?: number;
  deliveryTime?: string;
  trackingStatus: string;
  lastMileCarrier?: string;
  lastTrackNumber?: string;
  trackDetails?: Array<{
    date: string;
    time: string;
    status: string;
    location?: string;
    description: string;
  }>;
}

// Shipping Types
export interface CJShippingMethod {
  logisticName: string;
  logisticCode: string;
  logisticPrice: number;
  logisticPriceCn: number;
  logisticAging: string;
  currency: string;
}

export class CJService {
  private baseUrl = 'https://developers.cjdropshipping.com/api2.0/v1';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshTokenExpiry: Date | null = null;

  constructor(private config: CJConfig) {}

  // ============ AUTHENTICATION ============

  /**
   * Get access token using email and API key
   * Access token expires in 15 days, refresh token in 180 days
   */
  private async getAccessToken(): Promise<string> {
    const now = new Date();

    // Return existing token if still valid
    if (this.accessToken && this.tokenExpiry && now < this.tokenExpiry) {
      return this.accessToken;
    }

    // Try to refresh token if available and valid
    if (this.refreshToken && this.refreshTokenExpiry && now < this.refreshTokenExpiry) {
      try {
        await this.refreshAccessToken();
        return this.accessToken!;
      } catch (error) {
        // If refresh fails, fall through to get new token
      }
    }

    // Get new access token
    try {
      const response = await apiRequest<CJAuthResponse>(
        `${this.baseUrl}/authentication/getAccessToken`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.config.email,
            password: this.config.apiKey,
          }),
        }
      );

      if (!response.result || response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Failed to get access token');
      }

      this.accessToken = response.data.accessToken;
      this.refreshToken = response.data.refreshToken;
      this.tokenExpiry = new Date(response.data.accessTokenExpiryDate);
      this.refreshTokenExpiry = new Date(response.data.refreshTokenExpiryDate);

      return this.accessToken;
    } catch (error) {
      throw new Error(`CJ Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiRequest<CJAuthResponse>(
        `${this.baseUrl}/authentication/refreshAccessToken`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refreshToken: this.refreshToken,
          }),
        }
      );

      if (!response.result || response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Failed to refresh token');
      }

      this.accessToken = response.data.accessToken;
      this.refreshToken = response.data.refreshToken;
      this.tokenExpiry = new Date(response.data.accessTokenExpiryDate);
      this.refreshTokenExpiry = new Date(response.data.refreshTokenExpiryDate);
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get headers for authenticated requests
   */
  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    };
  }

  /**
   * Logout and invalidate tokens
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const headers = await this.getHeaders();
      await apiRequest(
        `${this.baseUrl}/authentication/logout`,
        {
          method: 'POST',
          headers,
        },
        'cj'
      );

      // Clear local tokens
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      this.refreshTokenExpiry = null;

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  // ============ PRODUCT SEARCH & CATALOG ============

  /**
   * Search products by keyword, category, or filters
   * Returns 20 results per page (CJ API fixed page size)
   */
  async searchProducts(params: {
    keyword?: string;
    categoryId?: string;
    pageNum?: number;
    pageSize?: number;
    deliveryTime?: 24 | 48 | 72; // Fast delivery filter
    priceMin?: number;
    priceMax?: number;
  } = {}): Promise<PaginatedResponse<CJProduct>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({
        productNameEn: params.keyword,
        categoryId: params.categoryId,
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 20,
        deliveryTime: params.deliveryTime,
        priceMin: params.priceMin,
        priceMax: params.priceMax,
      });

      const response = await apiRequest<CJApiResponse<{
        list: CJProduct[];
        pageNum: number;
        pageSize: number;
        total: number;
      }>>(
        `${this.baseUrl}/product/list?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200) {
        throw new Error(response.message || 'Failed to search products');
      }

      return {
        success: true,
        data: response.data.list || [],
        pagination: {
          page: response.data.pageNum,
          limit: response.data.pageSize,
          total: response.data.total,
          totalPages: Math.ceil(response.data.total / response.data.pageSize),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search products',
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }
  }

  /**
   * Get detailed product information including variants
   */
  async getProduct(productId: string): Promise<ApiResponse<CJProductDetail>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({ pid: productId });

      const response = await apiRequest<CJApiResponse<CJProductDetail>>(
        `${this.baseUrl}/product/query?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Product not found');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product',
      };
    }
  }

  /**
   * Get variant details by variant ID
   */
  async getVariant(variantId: string): Promise<ApiResponse<CJVariant>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({ vid: variantId });

      const response = await apiRequest<CJApiResponse<CJVariant>>(
        `${this.baseUrl}/product/variant/queryByVid?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Variant not found');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch variant',
      };
    }
  }

  /**
   * Get all product categories
   */
  async getCategories(): Promise<ApiResponse<CJCategory[]>> {
    try {
      const headers = await this.getHeaders();

      const response = await apiRequest<CJApiResponse<CJCategory[]>>(
        `${this.baseUrl}/product/getCategory`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200) {
        throw new Error(response.message || 'Failed to fetch categories');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
      };
    }
  }

  /**
   * Add product to "My Products" list
   */
  async addToMyProducts(productId: string): Promise<ApiResponse<void>> {
    try {
      const headers = await this.getHeaders();

      const response = await apiRequest<CJApiResponse<unknown>>(
        `${this.baseUrl}/product/addToMyProduct`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ productId }),
        },
        'cj'
      );

      if (!response.result || response.code !== 200) {
        throw new Error(response.message || 'Failed to add product');
      }

      return { success: true, message: 'Product added successfully' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add product',
      };
    }
  }

  /**
   * Query my saved products
   */
  async getMyProducts(params: {
    keyword?: string;
    pageNum?: number;
    pageSize?: number;
  } = {}): Promise<PaginatedResponse<CJProduct>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({
        keyword: params.keyword,
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 20,
      });

      const response = await apiRequest<CJApiResponse<{
        list: CJProduct[];
        pageNum: number;
        pageSize: number;
        total: number;
      }>>(
        `${this.baseUrl}/product/myProduct/query?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200) {
        throw new Error(response.message || 'Failed to fetch my products');
      }

      return {
        success: true,
        data: response.data.list || [],
        pagination: {
          page: response.data.pageNum,
          limit: response.data.pageSize,
          total: response.data.total,
          totalPages: Math.ceil(response.data.total / response.data.pageSize),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch my products',
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    }
  }

  // ============ INVENTORY & STOCK ============

  /**
   * Get inventory by product ID across all warehouses
   */
  async getInventoryByProduct(productId: string): Promise<ApiResponse<CJInventory[]>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({ pid: productId });

      const response = await apiRequest<CJApiResponse<CJInventory[]>>(
        `${this.baseUrl}/product/stock/getInventoryByPid?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200) {
        throw new Error(response.message || 'Failed to fetch inventory');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory',
      };
    }
  }

  /**
   * Get inventory by variant ID across all warehouses
   */
  async getInventoryByVariant(variantId: string): Promise<ApiResponse<CJInventory[]>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({ vid: variantId });

      const response = await apiRequest<CJApiResponse<CJInventory[]>>(
        `${this.baseUrl}/product/stock/queryByVid?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200) {
        throw new Error(response.message || 'Failed to fetch inventory');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory',
      };
    }
  }

  /**
   * Get inventory by SKU
   */
  async getInventoryBySku(sku: string): Promise<ApiResponse<CJInventory[]>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({ sku });

      const response = await apiRequest<CJApiResponse<CJInventory[]>>(
        `${this.baseUrl}/product/stock/queryBySku?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200) {
        throw new Error(response.message || 'Failed to fetch inventory');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory',
      };
    }
  }

  /**
   * Check if variant has sufficient stock for order
   */
  async checkStock(
    variantId: string,
    quantity: number = 1,
    countryCode?: string
  ): Promise<ApiResponse<{
    stock: number;
    available: boolean;
    warehouse?: string;
    warehouses?: Array<{ name: string; stock: number; countryCode: string }>;
  }>> {
    try {
      const inventoryResult = await this.getInventoryByVariant(variantId);

      if (!inventoryResult.success || !inventoryResult.data) {
        return {
          success: false,
          error: 'Failed to check stock',
        };
      }

      // Filter by country if specified
      let targetInventory = inventoryResult.data;
      if (countryCode) {
        targetInventory = inventoryResult.data.filter(inv => inv.countryCode === countryCode);
      }

      // Calculate total available stock
      const totalStock = targetInventory.reduce((sum, inv) => sum + inv.totalInventoryNum, 0);
      const available = totalStock >= quantity;

      // Include warehouse details
      const warehouses = inventoryResult.data.map(inv => ({
        name: inv.areaEn,
        stock: inv.totalInventoryNum,
        countryCode: inv.countryCode,
      }));

      return {
        success: true,
        data: {
          stock: totalStock,
          available,
          warehouse: targetInventory[0]?.areaEn,
          warehouses,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check stock',
      };
    }
  }

  // ============ ORDER CREATION & FULFILLMENT ============

  /**
   * Create a fulfillment order
   * Order statuses: CREATED, PENDING, PROCESSING, DISPATCHED, COMPLETED, CANCELLED
   */
  async createOrder(orderData: CJOrderCreate): Promise<ApiResponse<{
    orderId: string;
    orderNumber: string;
  }>> {
    try {
      const headers = await this.getHeaders();

      const response = await apiRequest<CJApiResponse<{
        orderId: string;
        orderNumber: string;
      }>>(
        `${this.baseUrl}/shopping/order/createOrder`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(orderData),
        },
        'cj'
      );

      if (!response.result || response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Failed to create order');
      }

      return {
        success: true,
        data: response.data,
        message: 'Order created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  }

  /**
   * Get order details by order ID
   */
  async getOrder(orderId: string): Promise<ApiResponse<CJOrder>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({ orderId });

      const response = await apiRequest<CJApiResponse<CJOrder>>(
        `${this.baseUrl}/shopping/order/query?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Order not found');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order',
      };
    }
  }

  /**
   * Get list of orders with filters
   */
  async getOrders(params: {
    orderStatus?: string;
    orderNumber?: string;
    pageNum?: number;
    pageSize?: number;
    createDateStart?: string;
    createDateEnd?: string;
  } = {}): Promise<PaginatedResponse<CJOrder>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({
        orderStatus: params.orderStatus,
        orderNumber: params.orderNumber,
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10,
        createDateStart: params.createDateStart,
        createDateEnd: params.createDateEnd,
      });

      const response = await apiRequest<CJApiResponse<{
        list: CJOrder[];
        pageNum: number;
        pageSize: number;
        total: number;
      }>>(
        `${this.baseUrl}/shopping/order/list?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200) {
        throw new Error(response.message || 'Failed to fetch orders');
      }

      return {
        success: true,
        data: response.data.list || [],
        pagination: {
          page: response.data.pageNum,
          limit: response.data.pageSize,
          total: response.data.total,
          totalPages: Math.ceil(response.data.total / response.data.pageSize),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
    }
  }

  // ============ SHIPMENT TRACKING ============

  /**
   * Get tracking information by tracking number
   */
  async getTracking(trackingNumber: string): Promise<ApiResponse<CJTrackingInfo>> {
    try {
      const headers = await this.getHeaders();
      const query = buildQueryString({ trackNumber: trackingNumber });

      const response = await apiRequest<CJApiResponse<CJTrackingInfo>>(
        `${this.baseUrl}/logistic/getTrackInfo?${query}`,
        { headers },
        'cj'
      );

      if (!response.result || response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Tracking not found');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tracking',
      };
    }
  }

  /**
   * Get tracking information by order ID
   */
  async getTrackingByOrder(orderId: string): Promise<ApiResponse<{
    trackingNumber: string;
    carrier: string;
    trackingUrl: string;
    status: string;
  }>> {
    try {
      const orderResult = await this.getOrder(orderId);

      if (!orderResult.success || !orderResult.data) {
        return {
          success: false,
          error: 'Failed to get order details',
        };
      }

      const order = orderResult.data;
      if (!order.trackNumber) {
        return {
          success: false,
          error: 'Tracking number not available yet',
        };
      }

      return {
        success: true,
        data: {
          trackingNumber: order.trackNumber,
          carrier: order.logisticName || 'Unknown',
          trackingUrl: `https://t.17track.net/en#nums=${order.trackNumber}`,
          status: order.orderStatus,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tracking by order',
      };
    }
  }

  // ============ SHIPPING & FREIGHT ============

  /**
   * Calculate shipping freight for products
   */
  async calculateFreight(params: {
    startCountryCode: string;
    endCountryCode: string;
    products: Array<{
      vid: string;
      quantity: number;
    }>;
  }): Promise<ApiResponse<CJShippingMethod[]>> {
    try {
      const headers = await this.getHeaders();

      const response = await apiRequest<CJApiResponse<CJShippingMethod[]>>(
        `${this.baseUrl}/logistic/freightCalculate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(params),
        },
        'cj'
      );

      if (!response.result || response.code !== 200) {
        throw new Error(response.message || 'Failed to calculate freight');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate freight',
      };
    }
  }

  /**
   * Get available shipping methods for a destination
   */
  async getShippingMethods(params: {
    startCountry?: string;
    endCountry: string;
    weight?: number;
    products?: Array<{ vid: string; quantity: number }>;
  }): Promise<ApiResponse<Array<{
    name: string;
    code: string;
    price: number;
    priceCny: number;
    deliveryDays: string;
    currency: string;
  }>>> {
    try {
      // If products provided, use freight calculation
      if (params.products && params.products.length > 0) {
        const freightResult = await this.calculateFreight({
          startCountryCode: params.startCountry || 'CN',
          endCountryCode: params.endCountry,
          products: params.products,
        });

        if (!freightResult.success || !freightResult.data) {
          return {
            success: false,
            error: freightResult.error || 'Failed to get shipping methods',
          };
        }

        return {
          success: true,
          data: freightResult.data.map(m => ({
            name: m.logisticName,
            code: m.logisticCode,
            price: m.logisticPrice,
            priceCny: m.logisticPriceCn,
            deliveryDays: m.logisticAging,
            currency: m.currency,
          })),
        };
      }

      // Fallback to basic calculation
      return {
        success: false,
        error: 'Products required for freight calculation',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get shipping methods',
      };
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Test connection to CJ Dropshipping API
   */
  async testConnection(): Promise<ApiResponse<{ authenticated: boolean; email: string }>> {
    try {
      await this.getAccessToken();

      // Test by fetching categories (lightweight endpoint)
      const result = await this.getCategories();

      return {
        success: result.success,
        data: {
          authenticated: result.success,
          email: this.config.email,
        },
        message: result.success ? 'Successfully connected to CJ Dropshipping' : 'Failed to connect',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to CJ Dropshipping',
      };
    }
  }

  /**
   * Get human-readable order status
   */
  getOrderStatusDescription(status: string): string {
    const statusMap: Record<string, string> = {
      'CREATED': 'Awaiting Payment',
      'PENDING': 'Payment Received - Processing',
      'PROCESSING': 'Being Prepared for Shipment',
      'DISPATCHED': 'Shipped - In Transit',
      'COMPLETED': 'Delivered',
      'CANCELLED': 'Cancelled',
    };
    return statusMap[status] || status;
  }
}

// Factory function
export function createCJService(config: CJConfig): CJService {
  return new CJService(config);
}
