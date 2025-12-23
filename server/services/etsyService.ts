/**
 * Etsy Open API v3 Service
 *
 * Production-ready TypeScript service for Etsy API integration
 * Supports OAuth 2.0, receipt management, listing creation/updates, and inventory sync
 *
 * @see https://developer.etsy.com/documentation/
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';

// ============================================================================
// Type Definitions
// ============================================================================

interface EtsyConfig {
  apiKey: string;
  sharedSecret: string;
  redirectUri: string;
  scopes: string[];
  baseUrl?: string;
  shopId?: string;
}

interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number; // Calculated timestamp when token expires
  created_at?: number; // Timestamp when token was created
}

interface PKCEChallenge {
  code_verifier: string;
  code_challenge: string;
  state: string;
}

interface EtsyReceipt {
  receipt_id: number;
  receipt_type: number;
  seller_user_id: number;
  seller_email: string;
  buyer_user_id: number;
  buyer_email: string;
  name: string;
  first_line: string;
  second_line?: string;
  city: string;
  state?: string;
  zip: string;
  status: string;
  formatted_address: string;
  country_iso: string;
  payment_method: string;
  payment_email?: string;
  message_from_seller?: string;
  message_from_buyer?: string;
  message_from_payment?: string;
  is_paid: boolean;
  is_shipped: boolean;
  create_timestamp: number;
  created_timestamp: number;
  update_timestamp: number;
  updated_timestamp: number;
  is_gift: boolean;
  gift_message?: string;
  grandtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  subtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_shipping_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_tax_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_vat_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  discount_amt: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  gift_wrap_price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  shipments: Array<{
    receipt_shipping_id: number;
    shipment_notification_timestamp: number;
    carrier_name: string;
    tracking_code: string;
  }>;
  transactions: EtsyTransaction[];
}

interface EtsyTransaction {
  transaction_id: number;
  title: string;
  description: string;
  seller_user_id: number;
  buyer_user_id: number;
  create_timestamp: number;
  created_timestamp: number;
  paid_timestamp: number;
  shipped_timestamp: number;
  quantity: number;
  listing_image_id: number;
  receipt_id: number;
  is_digital: boolean;
  file_data: string;
  listing_id: number;
  sku: string;
  product_id: number;
  transaction_type: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  shipping_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  variations: Array<{
    property_id: number;
    value_id: number;
    formatted_name: string;
    formatted_value: string;
  }>;
  product_data: Array<{
    property_id: number;
    property_name: string;
    scale_id: number;
    scale_name: string;
    value_ids: number[];
    values: string[];
  }>;
  shipping_profile_id: number;
  min_processing_days: number;
  max_processing_days: number;
  shipping_method?: string;
  shipping_upgrade?: string;
  expected_ship_date: number;
  buyer_coupon: number;
  shop_coupon: number;
}

interface EtsyListing {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: 'active' | 'inactive' | 'sold_out' | 'draft' | 'expired';
  creation_timestamp: number;
  created_timestamp: number;
  ending_timestamp: number;
  original_creation_timestamp: number;
  last_modified_timestamp: number;
  updated_timestamp: number;
  state_timestamp: number;
  quantity: number;
  shop_section_id?: number;
  featured_rank: number;
  url: string;
  num_favorers: number;
  non_taxable: boolean;
  is_taxable: boolean;
  is_customizable: boolean;
  is_personalizable: boolean;
  personalization_is_required: boolean;
  personalization_char_count_max?: number;
  personalization_instructions?: string;
  listing_type: 'physical' | 'download' | 'both';
  tags: string[];
  materials: string[];
  shipping_profile_id?: number;
  return_policy_id?: number;
  processing_min?: number;
  processing_max?: number;
  who_made: 'i_did' | 'someone_else' | 'collective';
  when_made: string;
  is_supply: boolean;
  item_weight?: number;
  item_weight_unit?: 'oz' | 'lb' | 'g' | 'kg';
  item_length?: number;
  item_width?: number;
  item_height?: number;
  item_dimensions_unit?: 'in' | 'ft' | 'mm' | 'cm' | 'm';
  is_private: boolean;
  style: string[];
  file_data: string;
  has_variations: boolean;
  should_auto_renew: boolean;
  language: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  taxonomy_id: number;
}

interface CreateListingParams {
  shop_id: number;
  quantity: number;
  title: string;
  description: string;
  price: number;
  who_made: 'i_did' | 'someone_else' | 'collective';
  when_made: string;
  taxonomy_id: number;
  shipping_profile_id?: number;
  return_policy_id?: number;
  materials?: string[];
  tags?: string[];
  styles?: string[];
  item_weight?: number;
  item_length?: number;
  item_width?: number;
  item_height?: number;
  item_weight_unit?: 'oz' | 'lb' | 'g' | 'kg';
  item_dimensions_unit?: 'in' | 'ft' | 'mm' | 'cm' | 'm';
  is_personalizable?: boolean;
  personalization_is_required?: boolean;
  personalization_char_count_max?: number;
  personalization_instructions?: string;
  production_partner_ids?: number[];
  image_ids?: number[];
  is_supply?: boolean;
  is_customizable?: boolean;
  should_auto_renew?: boolean;
  is_taxable?: boolean;
  type?: 'physical' | 'download';
}

interface ListingInventory {
  products: ListingProduct[];
  price_on_property?: number[];
  quantity_on_property?: number[];
  sku_on_property?: number[];
}

interface ListingProduct {
  sku?: string;
  property_values: PropertyValue[];
  offerings: ListingOffering[];
}

interface PropertyValue {
  property_id: number;
  property_name: string;
  scale_id?: number;
  scale_name?: string;
  value_ids: number[];
  values: string[];
}

interface ListingOffering {
  quantity: number;
  is_enabled: boolean;
  price: number;
}

interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

interface EtsyApiError {
  error: string;
  error_msg?: string;
}

// ============================================================================
// Etsy Service Class
// ============================================================================

export class EtsyService {
  private config: EtsyConfig;
  private client: AxiosInstance;
  private tokens?: OAuthTokens;
  private tokenRefreshPromise?: Promise<OAuthTokens>;

  constructor(config: EtsyConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.etsy.com/v3',
      scopes: config.scopes.length > 0 ? config.scopes : [
        'transactions_r',
        'transactions_w',
        'listings_r',
        'listings_w',
        'shops_r',
        'shops_w',
      ],
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
      },
    });

    // Add request interceptor for token refresh
    this.client.interceptors.request.use(
      async (config) => {
        if (this.tokens && this.isTokenExpired()) {
          await this.refreshAccessToken();
        }
        if (this.tokens) {
          config.headers.Authorization = `Bearer ${this.tokens.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<EtsyApiError>) => {
        if (error.response?.status === 401 && this.tokens) {
          // Token expired, try to refresh
          try {
            await this.refreshAccessToken();
            // Retry the original request
            const originalRequest = error.config as AxiosRequestConfig;
            if (originalRequest && this.tokens) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${this.tokens.access_token}`;
              return this.client.request(originalRequest);
            }
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(this.formatError(error));
      }
    );
  }

  // ============================================================================
  // OAuth 2.0 Authentication Methods
  // ============================================================================

  /**
   * Generate PKCE challenge for OAuth flow
   * PKCE (Proof Key for Code Exchange) is required by Etsy API
   */
  public generatePKCE(): PKCEChallenge {
    const code_verifier = this.generateRandomString(128);
    const code_challenge = this.base64UrlEncode(
      crypto.createHash('sha256').update(code_verifier).digest()
    );
    const state = this.generateRandomString(32);

    return {
      code_verifier,
      code_challenge,
      state,
    };
  }

  /**
   * Get authorization URL for OAuth flow
   * Redirect user to this URL to authorize your app
   */
  public getAuthorizationUrl(pkce: PKCEChallenge): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.apiKey,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: pkce.state,
      code_challenge: pkce.code_challenge,
      code_challenge_method: 'S256',
    });

    return `https://www.etsy.com/oauth/connect?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * Call this after user authorizes and returns with code
   */
  public async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<OAuthTokens> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.apiKey,
        redirect_uri: this.config.redirectUri,
        code: code,
        code_verifier: codeVerifier,
      });

      const response = await axios.post<OAuthTokens>(
        'https://api.etsy.com/v3/public/oauth/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.tokens = this.enhanceToken(response.data);
      return this.tokens;
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Refresh access token using refresh token
   * Tokens expire after 1 hour, refresh tokens last 90 days
   */
  public async refreshAccessToken(): Promise<OAuthTokens> {
    // Prevent multiple simultaneous refresh requests
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    this.tokenRefreshPromise = (async () => {
      try {
        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.apiKey,
          refresh_token: this.tokens!.refresh_token,
        });

        const response = await axios.post<OAuthTokens>(
          'https://api.etsy.com/v3/public/oauth/token',
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        this.tokens = this.enhanceToken(response.data);
        return this.tokens;
      } catch (error) {
        throw this.formatError(error as AxiosError);
      } finally {
        this.tokenRefreshPromise = undefined;
      }
    })();

    return this.tokenRefreshPromise;
  }

  /**
   * Set existing tokens (e.g., loaded from database)
   */
  public setTokens(tokens: OAuthTokens): void {
    this.tokens = this.enhanceToken(tokens);
  }

  /**
   * Get current tokens
   */
  public getTokens(): OAuthTokens | undefined {
    return this.tokens;
  }

  /**
   * Check if token is expired or about to expire (within 5 minutes)
   */
  private isTokenExpired(): boolean {
    if (!this.tokens?.expires_at) {
      return false;
    }
    const now = Date.now();
    const expirationBuffer = 5 * 60 * 1000; // 5 minutes
    return now >= this.tokens.expires_at - expirationBuffer;
  }

  /**
   * Enhance token with calculated expiration timestamps
   */
  private enhanceToken(token: OAuthTokens): OAuthTokens {
    const now = Date.now();
    return {
      ...token,
      created_at: token.created_at || now,
      expires_at: token.expires_at || now + token.expires_in * 1000,
    };
  }

  // ============================================================================
  // Shop Receipts / Orders Methods
  // ============================================================================

  /**
   * Get shop receipts (orders)
   * Requires transactions_r scope
   */
  public async getShopReceipts(
    shopId: number,
    options: {
      limit?: number;
      offset?: number;
      sort_on?: 'created' | 'updated' | 'paid';
      sort_order?: 'asc' | 'desc';
      min_created?: number;
      max_created?: number;
      min_last_modified?: number;
      max_last_modified?: number;
      was_paid?: boolean;
      was_shipped?: boolean;
      was_delivered?: boolean;
    } = {}
  ): Promise<PaginatedResponse<EtsyReceipt>> {
    try {
      const params = new URLSearchParams();
      const limit = Math.min(options.limit || 25, 100);
      params.append('limit', limit.toString());

      if (options.offset) params.append('offset', options.offset.toString());
      if (options.sort_on) params.append('sort_on', options.sort_on);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.min_created) params.append('min_created', options.min_created.toString());
      if (options.max_created) params.append('max_created', options.max_created.toString());
      if (options.min_last_modified) params.append('min_last_modified', options.min_last_modified.toString());
      if (options.max_last_modified) params.append('max_last_modified', options.max_last_modified.toString());
      if (options.was_paid !== undefined) params.append('was_paid', options.was_paid.toString());
      if (options.was_shipped !== undefined) params.append('was_shipped', options.was_shipped.toString());
      if (options.was_delivered !== undefined) params.append('was_delivered', options.was_delivered.toString());

      const response = await this.client.get<PaginatedResponse<EtsyReceipt>>(
        `/application/shops/${shopId}/receipts?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Get all receipts with automatic pagination
   * Note: Etsy limits offset to 12,000 for performance
   */
  public async getAllShopReceipts(
    shopId: number,
    options: Parameters<typeof this.getShopReceipts>[1] = {}
  ): Promise<EtsyReceipt[]> {
    const allReceipts: EtsyReceipt[] = [];
    const maxOffset = 12000;
    let offset = 0;
    let hasMore = true;

    while (hasMore && offset < maxOffset) {
      const response = await this.getShopReceipts(shopId, {
        ...options,
        limit: 100,
        offset,
      });

      allReceipts.push(...response.results);
      offset += response.results.length;
      hasMore = response.results.length === 100 && allReceipts.length < response.count;
    }

    return allReceipts;
  }

  /**
   * Get a specific receipt by ID
   */
  public async getShopReceipt(shopId: number, receiptId: number): Promise<EtsyReceipt> {
    try {
      const response = await this.client.get<EtsyReceipt>(
        `/application/shops/${shopId}/receipts/${receiptId}`
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  // ============================================================================
  // Listings Methods
  // ============================================================================

  /**
   * Get listing by ID
   */
  public async getListing(listingId: number): Promise<EtsyListing> {
    try {
      const response = await this.client.get<EtsyListing>(
        `/application/listings/${listingId}`
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Get all listings for a shop
   */
  public async getShopListings(
    shopId: number,
    options: {
      limit?: number;
      offset?: number;
      state?: 'active' | 'inactive' | 'sold_out' | 'draft' | 'expired';
      sort_on?: 'created' | 'price' | 'updated' | 'score';
      sort_order?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedResponse<EtsyListing>> {
    try {
      const params = new URLSearchParams();
      const limit = Math.min(options.limit || 25, 100);
      params.append('limit', limit.toString());

      if (options.offset) params.append('offset', options.offset.toString());
      if (options.state) params.append('state', options.state);
      if (options.sort_on) params.append('sort_on', options.sort_on);
      if (options.sort_order) params.append('sort_order', options.sort_order);

      const response = await this.client.get<PaginatedResponse<EtsyListing>>(
        `/application/shops/${shopId}/listings?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Create a draft listing
   */
  public async createDraftListing(params: CreateListingParams): Promise<EtsyListing> {
    try {
      const response = await this.client.post<EtsyListing>(
        `/application/shops/${params.shop_id}/listings`,
        params
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Update a listing
   */
  public async updateListing(
    listingId: number,
    updates: Partial<CreateListingParams>
  ): Promise<EtsyListing> {
    try {
      const response = await this.client.patch<EtsyListing>(
        `/application/listings/${listingId}`,
        updates
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Delete a listing
   */
  public async deleteListing(listingId: number): Promise<void> {
    try {
      await this.client.delete(`/application/listings/${listingId}`);
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  // ============================================================================
  // Inventory Management Methods
  // ============================================================================

  /**
   * Get listing inventory
   */
  public async getListingInventory(listingId: number): Promise<ListingInventory> {
    try {
      const response = await this.client.get<ListingInventory>(
        `/application/listings/${listingId}/inventory`
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Update listing inventory
   * IMPORTANT: Provide complete inventory structure
   */
  public async updateListingInventory(
    listingId: number,
    inventory: ListingInventory
  ): Promise<ListingInventory> {
    try {
      const cleanedInventory = this.cleanInventoryForUpdate(inventory);

      const response = await this.client.put<ListingInventory>(
        `/application/listings/${listingId}/inventory`,
        cleanedInventory
      );
      return response.data;
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Update quantity for a listing
   */
  public async updateListingQuantity(
    listingId: number,
    quantity: number,
    sku?: string
  ): Promise<ListingInventory> {
    try {
      const inventory = await this.getListingInventory(listingId);

      inventory.products.forEach((product) => {
        if (!sku || product.sku === sku) {
          product.offerings.forEach((offering) => {
            offering.quantity = quantity;
          });
        }
      });

      return await this.updateListingInventory(listingId, inventory);
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Sync inventory from external source
   */
  public async syncInventory(
    updates: Array<{ listingId: number; quantity: number; sku?: string }>
  ): Promise<Array<{ listingId: number; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      updates.map(async ({ listingId, quantity, sku }) => {
        await this.updateListingQuantity(listingId, quantity, sku);
        return { listingId, success: true };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          listingId: updates[index].listingId,
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Clean inventory object for update by removing read-only fields
   */
  private cleanInventoryForUpdate(inventory: any): ListingInventory {
    const cleaned: ListingInventory = {
      products: [],
      price_on_property: inventory.price_on_property,
      quantity_on_property: inventory.quantity_on_property,
      sku_on_property: inventory.sku_on_property,
    };

    cleaned.products = inventory.products.map((product: any) => ({
      sku: product.sku,
      property_values: product.property_values.map((pv: any) => ({
        property_id: pv.property_id,
        property_name: pv.property_name,
        value_ids: pv.value_ids,
        values: pv.values,
      })),
      offerings: product.offerings.map((offering: any) => ({
        quantity: offering.quantity,
        is_enabled: offering.is_enabled,
        price: typeof offering.price === 'object'
          ? offering.price.amount / offering.price.divisor
          : offering.price,
      })),
    }));

    return cleaned;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Convert Etsy Money object to decimal number
   */
  public moneyToDecimal(money: { amount: number; divisor: number }): number {
    return money.amount / money.divisor;
  }

  /**
   * Convert decimal number to Etsy Money object
   */
  public decimalToMoney(
    amount: number,
    currencyCode: string = 'USD'
  ): { amount: number; divisor: number; currency_code: string } {
    const divisor = 100;
    return {
      amount: Math.round(amount * divisor),
      divisor,
      currency_code: currencyCode,
    };
  }

  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }
    return result;
  }

  private base64UrlEncode(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private formatError(error: AxiosError<EtsyApiError>): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const errorMessage = data?.error || data?.error_msg || error.message;
      return new Error(`Etsy API Error (${status}): ${errorMessage}`);
    } else if (error.request) {
      return new Error('Etsy API Error: No response received from server');
    } else {
      return new Error(`Etsy API Error: ${error.message}`);
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  EtsyConfig,
  OAuthTokens,
  PKCEChallenge,
  EtsyReceipt,
  EtsyTransaction,
  EtsyListing,
  CreateListingParams,
  ListingInventory,
  ListingProduct,
  PropertyValue,
  ListingOffering,
  PaginatedResponse,
};

export default EtsyService;

// ============================================================================
// Factory Function for Route Compatibility
// ============================================================================

interface SimpleEtsyConfig {
  apiKey: string;
  shopId: string;
  accessToken?: string;
}

interface SimpleEtsyService {
  testConnection(): Promise<{ success: boolean; shop?: any; error?: string }>;
  getReceipts(options?: { limit?: number; offset?: number; was_shipped?: boolean }): Promise<any>;
  getReceipt(receiptId: number): Promise<any>;
  createShipment(receiptId: number, trackingCode: string, carrierName: string): Promise<any>;
  getListings(options?: { limit?: number; offset?: number; state?: string }): Promise<any>;
  getListing(listingId: number): Promise<any>;
  createListing(data: any): Promise<any>;
  updateListing(listingId: number, data: any): Promise<any>;
  updateInventory(listingId: number, quantity: number): Promise<any>;
  deleteListing(listingId: number): Promise<any>;
}

/**
 * Factory function to create a simplified Etsy service wrapper
 * Used by route handlers for easier API access
 */
export function createEtsyService(config: SimpleEtsyConfig): SimpleEtsyService {
  const shopId = parseInt(config.shopId, 10);

  const service = new EtsyService({
    apiKey: config.apiKey,
    sharedSecret: process.env.ETSY_SHARED_SECRET || '',
    redirectUri: process.env.ETSY_REDIRECT_URI || 'http://localhost:3001/api/etsy/callback',
    scopes: ['transactions_r', 'transactions_w', 'listings_r', 'listings_w'],
  });

  // Set access token if provided
  if (config.accessToken) {
    service.setTokens({
      access_token: config.accessToken,
      refresh_token: '',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  }

  return {
    async testConnection() {
      try {
        const listings = await service.getShopListings(shopId, { limit: 1 });
        return { success: true, shop: { listing_count: listings.count } };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },

    async getReceipts(options = {}) {
      return service.getShopReceipts(shopId, {
        limit: options.limit,
        offset: options.offset,
        was_shipped: options.was_shipped,
      });
    },

    async getReceipt(receiptId: number) {
      return service.getShopReceipt(shopId, receiptId);
    },

    async createShipment(_receiptId: number, _trackingCode: string, _carrierName: string) {
      // Note: Etsy API requires separate endpoint for shipment updates
      // This would need to be implemented with the shipping API
      throw new Error('Shipment creation requires Etsy shipping API implementation');
    },

    async getListings(options = {}) {
      return service.getShopListings(shopId, {
        limit: options.limit,
        offset: options.offset,
        state: options.state as any,
      });
    },

    async getListing(listingId: number) {
      return service.getListing(listingId);
    },

    async createListing(data: any) {
      return service.createDraftListing({
        shop_id: shopId,
        ...data,
      });
    },

    async updateListing(listingId: number, data: any) {
      return service.updateListing(listingId, data);
    },

    async updateInventory(listingId: number, quantity: number) {
      return service.updateListingQuantity(listingId, quantity);
    },

    async deleteListing(listingId: number) {
      return service.deleteListing(listingId);
    },
  };
}

// Static method helper for OAuth URL generation
EtsyService.getAuthUrl = function(apiKey: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: apiKey,
    redirect_uri: redirectUri,
    scope: 'transactions_r transactions_w listings_r listings_w',
    state: state,
    code_challenge: 'placeholder', // In production, use proper PKCE
    code_challenge_method: 'S256',
  });
  return `https://www.etsy.com/oauth/connect?${params.toString()}`;
};

// Add static method to class
declare module './etsyService.js' {
  namespace EtsyService {
    function getAuthUrl(apiKey: string, redirectUri: string, state: string): string;
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Initialize Service and OAuth Flow
 *
 * const etsyService = new EtsyService({
 *   apiKey: process.env.ETSY_API_KEY!,
 *   sharedSecret: process.env.ETSY_SHARED_SECRET!,
 *   redirectUri: 'https://yourapp.com/auth/etsy/callback',
 *   scopes: ['transactions_r', 'transactions_w', 'listings_r', 'listings_w'],
 * });
 *
 * // Generate PKCE challenge and get auth URL
 * const pkce = etsyService.generatePKCE();
 * // Store pkce.code_verifier and pkce.state in session
 * const authUrl = etsyService.getAuthorizationUrl(pkce);
 * // Redirect user to authUrl
 *
 * // After callback with authorization code:
 * const tokens = await etsyService.exchangeCodeForToken(code, pkce.code_verifier);
 * // Store tokens in database for this user
 *
 * // Later, load tokens from database:
 * etsyService.setTokens(savedTokens);
 */

/**
 * Example 2: Fetch Orders/Receipts
 *
 * // Get recent paid orders
 * const receipts = await etsyService.getShopReceipts(shopId, {
 *   limit: 100,
 *   was_paid: true,
 *   sort_on: 'created',
 *   sort_order: 'desc',
 * });
 *
 * console.log(`Found ${receipts.count} total receipts`);
 * receipts.results.forEach(receipt => {
 *   console.log(`Order #${receipt.receipt_id}: ${receipt.buyer_email}`);
 *   receipt.transactions.forEach(transaction => {
 *     console.log(`  - ${transaction.title} x${transaction.quantity}`);
 *   });
 * });
 *
 * // Get all receipts with automatic pagination
 * const allReceipts = await etsyService.getAllShopReceipts(shopId, {
 *   was_paid: true,
 *   min_created: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // Last 30 days
 * });
 *
 * // Get specific receipt
 * const receipt = await etsyService.getShopReceipt(shopId, receiptId);
 */

/**
 * Example 3: Create a New Listing
 *
 * const newListing = await etsyService.createDraftListing({
 *   shop_id: shopId,
 *   quantity: 100,
 *   title: 'Handmade Leather Wallet',
 *   description: 'Beautiful handcrafted leather wallet with card slots',
 *   price: 49.99,
 *   who_made: 'i_did',
 *   when_made: '2020_2023',
 *   taxonomy_id: 1234, // Category ID
 *   shipping_profile_id: 12345678,
 *   tags: ['wallet', 'leather', 'handmade', 'gift'],
 *   materials: ['leather', 'thread'],
 *   is_taxable: true,
 *   should_auto_renew: true,
 * });
 *
 * console.log(`Created listing: ${newListing.listing_id}`);
 */

/**
 * Example 4: Update Listing Details
 *
 * const updatedListing = await etsyService.updateListing(listingId, {
 *   title: 'Updated Title',
 *   price: 59.99,
 *   quantity: 50,
 *   description: 'Updated description with more details',
 * });
 */

/**
 * Example 5: Manage Inventory
 *
 * // Get current inventory
 * const inventory = await etsyService.getListingInventory(listingId);
 * console.log('Current products:', inventory.products);
 *
 * // Simple quantity update
 * await etsyService.updateListingQuantity(listingId, 25);
 *
 * // Update quantity for specific SKU
 * await etsyService.updateListingQuantity(listingId, 10, 'SKU-BLACK-LARGE');
 *
 * // Batch sync inventory from external source
 * const syncResults = await etsyService.syncInventory([
 *   { listingId: 123, quantity: 10 },
 *   { listingId: 456, quantity: 5, sku: 'SKU-001' },
 *   { listingId: 789, quantity: 20 },
 * ]);
 *
 * syncResults.forEach(result => {
 *   if (result.success) {
 *     console.log(`✓ Listing ${result.listingId} synced`);
 *   } else {
 *     console.error(`✗ Listing ${result.listingId} failed: ${result.error}`);
 *   }
 * });
 */

/**
 * Example 6: Working with Variations/Products
 *
 * // Get inventory for listing with variations
 * const inventory = await etsyService.getListingInventory(listingId);
 *
 * // Update inventory with variations (e.g., size and color)
 * const updatedInventory = {
 *   products: [
 *     {
 *       sku: 'WALLET-BLACK-SMALL',
 *       property_values: [
 *         {
 *           property_id: 200, // Primary color
 *           property_name: 'Primary color',
 *           value_ids: [1],
 *           values: ['Black'],
 *         },
 *         {
 *           property_id: 100, // Size
 *           property_name: 'Size',
 *           value_ids: [10],
 *           values: ['Small'],
 *         },
 *       ],
 *       offerings: [
 *         {
 *           quantity: 15,
 *           is_enabled: true,
 *           price: 49.99,
 *         },
 *       ],
 *     },
 *     {
 *       sku: 'WALLET-BROWN-LARGE',
 *       property_values: [
 *         {
 *           property_id: 200,
 *           property_name: 'Primary color',
 *           value_ids: [2],
 *           values: ['Brown'],
 *         },
 *         {
 *           property_id: 100,
 *           property_name: 'Size',
 *           value_ids: [11],
 *           values: ['Large'],
 *         },
 *       ],
 *       offerings: [
 *         {
 *           quantity: 25,
 *           is_enabled: true,
 *           price: 59.99,
 *         },
 *       ],
 *     },
 *   ],
 *   price_on_property: [200], // Price varies by color
 *   quantity_on_property: [200, 100], // Quantity varies by color and size
 *   sku_on_property: [200, 100], // SKU varies by color and size
 * };
 *
 * await etsyService.updateListingInventory(listingId, updatedInventory);
 */

/**
 * Example 7: Token Refresh (Automatic)
 *
 * // Tokens are automatically refreshed when expired
 * // The service handles this transparently via axios interceptors
 *
 * // You can also manually refresh:
 * const newTokens = await etsyService.refreshAccessToken();
 * // Save newTokens to database
 *
 * // Check current tokens:
 * const currentTokens = etsyService.getTokens();
 * if (currentTokens) {
 *   console.log('Token expires at:', new Date(currentTokens.expires_at!));
 * }
 */

/**
 * Example 8: Error Handling
 *
 * try {
 *   const listing = await etsyService.getListing(listingId);
 *   console.log('Listing:', listing.title);
 * } catch (error) {
 *   if (error instanceof Error) {
 *     if (error.message.includes('404')) {
 *       console.error('Listing not found');
 *     } else if (error.message.includes('401')) {
 *       console.error('Unauthorized - token may be expired');
 *     } else {
 *       console.error('API Error:', error.message);
 *     }
 *   }
 * }
 */

/**
 * Example 9: Money Conversion Utilities
 *
 * // Convert Etsy Money object to decimal
 * const receipt = await etsyService.getShopReceipt(shopId, receiptId);
 * const totalAmount = etsyService.moneyToDecimal(receipt.grandtotal);
 * console.log(`Total: $${totalAmount.toFixed(2)}`);
 *
 * // Convert decimal to Etsy Money object
 * const moneyObj = etsyService.decimalToMoney(49.99, 'USD');
 * // moneyObj = { amount: 4999, divisor: 100, currency_code: 'USD' }
 */

/**
 * Example 10: Complete Dropshipping Workflow
 *
 * // 1. Initialize service with stored tokens
 * const etsy = new EtsyService({
 *   apiKey: process.env.ETSY_API_KEY!,
 *   sharedSecret: process.env.ETSY_SHARED_SECRET!,
 *   redirectUri: process.env.ETSY_REDIRECT_URI!,
 *   scopes: ['transactions_r', 'listings_r', 'listings_w'],
 * });
 * etsy.setTokens(userTokens);
 *
 * // 2. Check for new orders
 * const recentOrders = await etsy.getShopReceipts(shopId, {
 *   was_paid: true,
 *   was_shipped: false,
 *   min_created: lastCheckTimestamp,
 * });
 *
 * // 3. Process each order
 * for (const receipt of recentOrders.results) {
 *   for (const transaction of receipt.transactions) {
 *     // Place order with supplier using transaction details
 *     await placeSupplierOrder({
 *       product: transaction.listing_id,
 *       quantity: transaction.quantity,
 *       shipping: {
 *         name: receipt.name,
 *         address: receipt.first_line,
 *         city: receipt.city,
 *         zip: receipt.zip,
 *         country: receipt.country_iso,
 *       },
 *     });
 *   }
 * }
 *
 * // 4. Sync inventory from supplier
 * const supplierInventory = await fetchSupplierInventory();
 * const inventoryUpdates = supplierInventory.map(item => ({
 *   listingId: item.etsyListingId,
 *   quantity: item.availableStock,
 *   sku: item.sku,
 * }));
 *
 * await etsy.syncInventory(inventoryUpdates);
 *
 * // 5. Create new listings from supplier catalog
 * for (const product of newSupplierProducts) {
 *   const listing = await etsy.createDraftListing({
 *     shop_id: shopId,
 *     quantity: product.stock,
 *     title: product.name,
 *     description: product.description,
 *     price: product.wholesalePrice * 2, // 100% markup
 *     who_made: 'someone_else',
 *     when_made: '2020_2023',
 *     taxonomy_id: product.categoryId,
 *     tags: product.tags,
 *     materials: product.materials,
 *   });
 *
 *   console.log(`Created listing ${listing.listing_id} for ${product.name}`);
 * }
 */
