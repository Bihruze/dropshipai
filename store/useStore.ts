
import { create } from 'zustand';
import { AppState, Product, ViewType, User, Settings, SupplierProduct, Order, OrderStatus, Notification } from '../types';
import { sendTelegramNotification } from '../lib/telegram';

const DEFAULT_SETTINGS: Settings = {
  shopifyStoreUrl: '',
  shopifyAccessToken: '',
  shopifyConnected: false,
  defaultMarkup: 2.5,
  minProfitMargin: 30,
  autoUpdatePrices: false,
  roundTo99: true,
  cjApiKey: '',
  claudeApiKey: '',
  telegramBotToken: '', // Set via Settings page - never hardcode tokens
  telegramChatId: '',   // Set via Settings page - never hardcode IDs
  notifyNewOrders: true,
  notifyLowStock: true,
  notifyDailySummary: false,
  language: 'English',
  currency: 'USD',
  timezone: 'UTC',
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Portable Electric Fruit Juicer',
    description: 'Compact wireless juicer for on-the-go health enthusiasts.',
    price: 29.99,
    category: 'Kitchenware',
    imageUrl: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400&h=400&fit=crop',
    status: 'active',
    aiScore: 92,
    createdAt: new Date().toISOString(),
    costPrice: 12.00,
    sku: 'JUICE-001',
    stock: 45,
    lowStockThreshold: 10,
    shopifyProductId: 'mock-shopify-1'
  },
  {
    id: '2',
    title: 'Smart LED Sunset Lamp',
    description: 'Relaxing app-controlled sunset lighting.',
    price: 15.50,
    category: 'Home Decor',
    imageUrl: 'https://images.unsplash.com/photo-1550537687-c91072c4792d?w=400&h=400&fit=crop',
    status: 'active',
    aiScore: 85,
    createdAt: new Date().toISOString(),
    costPrice: 5.50,
    sku: 'LAMP-002',
    stock: 3,
    lowStockThreshold: 5,
    shopifyProductId: 'mock-shopify-2'
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "ord-001",
    shopifyOrderId: "SH-5001",
    orderNumber: "#1001",
    customerName: "Alex Morgan",
    customerEmail: "alex@email.com",
    shippingAddress: {
      address1: "123 Commerce St",
      city: "New York",
      zip: "10001",
      country: "USA"
    },
    items: [
      { productId: "1", title: "Juicer Item", quantity: 1, price: 29.99, cost: 12.00, imageUrl: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=100&h=100&fit=crop" }
    ],
    subtotal: 29.99,
    shippingTotal: 5.99,
    totalPrice: 35.98,
    status: "pending",
    orderDate: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

export const useStore = create<AppState>((set, get) => {
  // Safe localStorage parsing with error handling
  let initialUser = null;
  let initialAuth = false;
  let initialSettings = DEFAULT_SETTINGS;

  try {
    const storedUser = localStorage.getItem('dropship_user');
    if (storedUser) {
      initialUser = JSON.parse(storedUser);
      initialAuth = true;
    }
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    localStorage.removeItem('dropship_user');
  }

  try {
    const storedSettings = localStorage.getItem('dropship_settings');
    if (storedSettings) {
      initialSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
    }
  } catch (error) {
    console.error('Failed to parse stored settings:', error);
    localStorage.removeItem('dropship_settings');
  }

  return {
    view: initialAuth ? 'dashboard' : 'login',
    setView: (view: ViewType) => set({ view }),
    editingProductId: null,
    setEditingProduct: (id: string | null) => set({ editingProductId: id, view: id ? 'product-edit' : 'products' }),
    user: initialUser,
    isAuthenticated: initialAuth,
    products: INITIAL_PRODUCTS,
    orders: INITIAL_ORDERS,
    notifications: [],
    settings: initialSettings,

    login: (email: string, name: string) => {
      const user = { email, name };
      localStorage.setItem('dropship_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, view: 'dashboard' });
    },

    logout: () => {
      localStorage.removeItem('dropship_user');
      set({ user: null, isAuthenticated: false, view: 'login' });
    },

    addProduct: (product: Product) => {
      set((state) => ({ products: [product, ...state.products] }));
      get().addNotification({
        type: 'system',
        title: 'Product Added',
        message: `${product.title} has been added to inventory.`,
      });
    },
    
    updateProduct: (id: string, updates: Partial<Product>) => {
      set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
      }));
      
      const product = get().products.find(p => p.id === id);
      if (product && product.stock <= product.lowStockThreshold && get().settings.notifyLowStock) {
        get().addNotification({
          type: 'stock',
          title: 'Low Stock Alert',
          message: `${product.title} stock is low (${product.stock} units left).`,
          data: { productId: id }
        });
        sendTelegramNotification('low_stock', product, get().settings);
      }
    },

    importProduct: (supplierProduct: SupplierProduct, sellingPrice: number) => {
      const newProduct: Product = {
        id: `local-${Date.now()}`,
        title: supplierProduct.title,
        description: supplierProduct.description,
        price: sellingPrice,
        category: supplierProduct.category,
        imageUrl: supplierProduct.images[0],
        status: 'draft',
        aiScore: Math.floor(Math.random() * 15) + 85,
        createdAt: new Date().toISOString(),
        sourceType: 'cj',
        sourceId: supplierProduct.id,
        costPrice: supplierProduct.costPrice,
        sku: `CJ-${supplierProduct.id.slice(-4)}-${Math.floor(Math.random() * 1000)}`,
        stock: 0,
        lowStockThreshold: 5,
        bulletPoints: supplierProduct.variants.length > 0 ? [`Variants: ${supplierProduct.variants.join(', ')}`] : [],
      };
      set((state) => ({ products: [newProduct, ...state.products] }));
      get().addNotification({
        type: 'system',
        title: 'Product Imported',
        message: `${newProduct.title} was successfully imported.`,
      });
    },

    deleteProduct: (id: string) => set((state) => ({
      products: state.products.filter(p => p.id !== id)
    })),

    bulkDeleteProducts: (ids: string[]) => set((state) => ({
      products: state.products.filter(p => !ids.includes(p.id))
    })),

    bulkUpdateStatus: (ids: string[], status: Product['status']) => set((state) => ({
      products: state.products.map(p => ids.includes(p.id) ? { ...p, status } : p)
    })),

    updateSettings: (newSettings: Partial<Settings>) => set((state) => {
      const updated = { ...state.settings, ...newSettings };
      localStorage.setItem('dropship_settings', JSON.stringify(updated));
      return { settings: updated };
    }),

    approveOrder: (id: string) => {
      const order = get().orders.find(o => o.id === id);
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status: 'approved' } : o)
      }));
      if (order) {
        get().addNotification({
          type: 'order',
          title: 'Order Approved',
          message: `Order ${order.orderNumber} is now being processed.`,
        });
      }
    },

    rejectOrder: (id: string) => {
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status: 'cancelled' } : o)
      }));
    },

    processOrder: (id: string) => {
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status: 'processing', cjOrderId: `CJ-${Math.floor(Math.random() * 100000)}` } : o)
      }));
    },

    shipOrder: (id: string, tracking: { number: string; carrier: string; url: string }) => {
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? { 
          ...o, 
          status: 'shipped', 
          trackingNumber: tracking.number, 
          carrier: tracking.carrier, 
          trackingUrl: tracking.url 
        } : o)
      }));
      
      const order = get().orders.find(o => o.id === id);
      if (order) {
        get().addNotification({
          type: 'order',
          title: 'Order Shipped',
          message: `${order.orderNumber} shipped via ${tracking.carrier}.`,
        });
        sendTelegramNotification('shipped', order, get().settings);
      }
    },

    seedOrders: () => {
      const customers = ["Liam Smith", "Olivia Jones", "Noah Brown", "Emma Wilson"];
      const orderId = `ord-${Date.now()}`;
      const newOrder: Order = {
        id: orderId,
        shopifyOrderId: `SH-${Math.floor(Math.random() * 10000)}`,
        orderNumber: `#${1002 + get().orders.length}`,
        customerName: customers[Math.floor(Math.random() * customers.length)],
        customerEmail: "customer@example.com",
        shippingAddress: { address1: "5th Avenue", city: "NYC", zip: "10001", country: "USA" },
        items: [{ productId: "1", title: "Fruit Juicer", quantity: 1, price: 29.99, cost: 12.00, imageUrl: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=100&h=100&fit=crop" }],
        subtotal: 29.99,
        shippingTotal: 4.99,
        totalPrice: 34.98,
        status: "pending",
        orderDate: new Date().toISOString()
      };
      
      set((state) => ({ orders: [newOrder, ...state.orders] }));
      
      if (get().settings.notifyNewOrders) {
        sendTelegramNotification('new_order', newOrder, get().settings);
      }
      
      get().addNotification({
        type: 'order',
        title: 'New Order!',
        message: `${newOrder.customerName} placed a new order.`,
      });
    },

    addNotification: (notif) => set((state) => ({
      notifications: [{
        ...notif,
        id: Math.random().toString(36).substring(2, 11),
        isRead: false,
        createdAt: new Date().toISOString()
      }, ...state.notifications].slice(0, 50)
    })),

    markNotificationRead: (id) => set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    })),

    markAllNotificationsRead: () => set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true }))
    }))
  };
});
