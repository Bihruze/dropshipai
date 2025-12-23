export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  status: 'active' | 'draft' | 'paused' | 'archived';
  competitorPrice?: number;
  aiScore: number;
  createdAt: string;
  sourceType?: string;
  sourceId?: string;
  costPrice: number;
  bulletPoints?: string[];
  seoTags?: string[];
  metaDescription?: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  shopifyProductId?: string;
  compareAtPrice?: number;
}

export interface SupplierProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  costPrice: number;
  suggestedPrice: number;
  category: string;
  rating: number;
  sold: number;
  shippingTime: string;
  variants: string[];
}

export interface Address {
  address1: string;
  address2?: string;
  city: string;
  zip: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  cost: number;
  imageUrl?: string;
}

export type OrderStatus = 'pending' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  shopifyOrderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  shippingTotal: number;
  totalPrice: number;
  status: OrderStatus;
  orderDate: string;
  cjOrderId?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
}

export interface Notification {
  id: string;
  type: 'order' | 'stock' | 'price' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export interface Settings {
  shopifyStoreUrl: string;
  shopifyAccessToken: string;
  shopifyConnected: boolean;
  defaultMarkup: number;
  minProfitMargin: number;
  autoUpdatePrices: boolean;
  roundTo99: boolean;
  cjApiKey: string;
  claudeApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  notifyNewOrders: boolean;
  notifyLowStock: boolean;
  notifyDailySummary: boolean;
  language: string;
  currency: string;
  timezone: string;
}

export type ViewType =
  | 'login'
  | 'dashboard'
  | 'research'
  | 'ai-content'
  | 'products'
  | 'product-edit'
  | 'product-new'
  | 'orders'
  | 'reports'
  | 'settings'
  | 'inventory'
  | 'studio'
  | 'agents'
  | 'agent-dashboard';

export interface User {
  email: string;
  name: string;
}

export interface AppState {
  view: ViewType;
  setView: (view: ViewType) => void;
  editingProductId: string | null;
  setEditingProduct: (id: string | null) => void;
  user: User | null;
  isAuthenticated: boolean;
  products: Product[];
  orders: Order[];
  notifications: Notification[];
  settings: Settings;
  login: (email: string, name: string) => void;
  logout: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  importProduct: (supplierProduct: SupplierProduct, sellingPrice: number) => void;
  deleteProduct: (id: string) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  bulkUpdateStatus: (ids: string[], status: Product['status']) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  // Order actions
  approveOrder: (id: string) => void;
  rejectOrder: (id: string) => void;
  processOrder: (id: string) => void;
  shipOrder: (id: string, tracking: { number: string; carrier: string; url: string }) => void;
  seedOrders: () => void;
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}