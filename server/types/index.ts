// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Shopify Types
export interface ShopifyOrder {
  id: number;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  customer: ShopifyCustomer;
  shipping_address: ShopifyAddress;
  line_items: ShopifyLineItem[];
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string;
}

export interface ShopifyProduct {
  id?: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

export interface ShopifyVariant {
  id?: number;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  compare_at_price?: string;
}

export interface ShopifyImage {
  src: string;
  alt?: string;
}

// Etsy Types
export interface EtsyReceipt {
  receipt_id: number;
  order_id: number;
  seller_user_id: number;
  buyer_user_id: number;
  buyer_email: string;
  name: string;
  first_line: string;
  second_line?: string;
  city: string;
  state: string;
  zip: string;
  country_iso: string;
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
  transactions: EtsyTransaction[];
  create_timestamp: number;
  update_timestamp: number;
  status: string;
}

export interface EtsyTransaction {
  transaction_id: number;
  listing_id: number;
  title: string;
  quantity: number;
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
}

export interface EtsyListing {
  listing_id?: number;
  title: string;
  description: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  quantity: number;
  tags: string[];
  taxonomy_id: number;
  who_made: 'i_did' | 'someone_else' | 'collective';
  when_made: string;
  is_supply: boolean;
  shipping_profile_id: number;
}

// CJ Dropshipping Types
export interface CJProduct {
  pid: string;
  productName: string;
  productNameEn: string;
  productImage: string;
  productWeight: number;
  productType: string;
  categoryId: string;
  categoryName: string;
  sellPrice: number;
  variants: CJVariant[];
}

export interface CJVariant {
  vid: string;
  variantName: string;
  variantImage: string;
  variantSellPrice: number;
  variantStock: number;
  variantSku: string;
}

export interface CJOrderCreate {
  orderNumber: string;
  shippingZip: string;
  shippingCountry: string;
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingCustomerName: string;
  shippingPhone: string;
  products: CJOrderProduct[];
}

export interface CJOrderProduct {
  vid: string;
  quantity: number;
}

export interface CJOrderResponse {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  trackingNumber?: string;
  logisticsName?: string;
}

// Internal App Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Request with user
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
