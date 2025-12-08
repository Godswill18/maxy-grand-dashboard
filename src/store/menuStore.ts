import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';

// Cart Storage Key
const CART_STORAGE_KEY = 'hotelMenuCart';
const ORDER_IDS_STORAGE_KEY = 'hotelOrderIds';

// Load cart from localStorage
const loadCartFromStorage = (): OrderItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const cart = JSON.parse(stored);
      // Validate cart structure
      if (Array.isArray(cart)) {
        return cart;
      }
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
  }
  return [];
};

// Save cart to localStorage
const saveCartToStorage = (cart: OrderItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

// Clear cart from localStorage
const clearCartFromStorage = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cart from storage:', error);
  }
};

// Load tracked order IDs from localStorage
const loadOrderIdsFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem(ORDER_IDS_STORAGE_KEY);
    if (stored) {
      const ids = JSON.parse(stored);
      if (Array.isArray(ids)) {
        return ids;
      }
    }
  } catch (error) {
    console.error('Error loading order IDs from storage:', error);
  }
  return [];
};

// Save tracked order IDs to localStorage
const saveOrderIdsToStorage = (orderIds: string[]) => {
  try {
    localStorage.setItem(ORDER_IDS_STORAGE_KEY, JSON.stringify(orderIds));
  } catch (error) {
    console.error('Error saving order IDs to storage:', error);
  }
};

// Add order ID to tracked list
const addOrderIdToStorage = (orderId: string) => {
  const currentIds = loadOrderIdsFromStorage();
  if (!currentIds.includes(orderId)) {
    currentIds.unshift(orderId); // Add to beginning
    // Keep only last 50 orders
    const limited = currentIds.slice(0, 50);
    saveOrderIdsToStorage(limited);
  }
};

// Types
interface MenuItem {
  _id: string;
  hotelId: string;
  name: string;
  description?: string;
  price: number;
  category: 'bar' | 'restaurant' | 'room service';
  images: string[];
  isAvailable: boolean;
  estimatedPrepTime?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  hotelId: string;
  guestId?: string;
  orderType: 'room service' | 'pickup' | 'table service';
  roomNumber?: string;
  tableNumber?: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  specialInstructions?: string;
  waiterId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'guest' | 'waiter' | 'headWaiter' | 'admin' | 'superAdmin';
  hotelId?: string;
}

interface MenuState {
  // State
  menuItems: MenuItem[];
  currentOrder: OrderItem[];
  orders: Order[];
  trackedOrderIds: string[];
  user: User | null;
  loading: boolean;
  error: string | null;

  // Menu Actions (Head Waiter Only)
  fetchMenuItems: (category?: string) => Promise<void>;
  createMenuItem: (data: FormData) => Promise<void>;
  updateMenuItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addMenuItemImages: (id: string, images: FormData) => Promise<void>;
  deleteMenuItemImage: (id: string, imagePath: string) => Promise<void>;

  // Order Actions (All Waiters)
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  createOrder: (orderData: {
    orderType: 'room service' | 'pickup' | 'table service';
    roomNumber?: string;
    tableNumber?: string;
    customerName?: string;
    specialInstructions?: string;
  }) => Promise<void>;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: string) => Promise<void>;
  trackOrders: (orderIds: string[]) => Promise<Order[]>;
  loadTrackedOrders: () => Promise<void>;
  addTrackedOrderId: (orderId: string) => void;

  // User Actions
  setUser: (user: User | null) => void;
  canCreateMenu: () => boolean;
  canPlaceOrder: () => boolean;
  
  // Cache Management
  initializeCart: () => void;
}

// API Configuration
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Zustand Store
export const useMenuStore = create<MenuState>((set, get) => ({
  // Initial State - Load from cache
  menuItems: [],
  currentOrder: loadCartFromStorage(),
  orders: [],
  trackedOrderIds: loadOrderIdsFromStorage(),
  user: null,
  loading: false,
  error: null,

  // Initialize cart from localStorage
  initializeCart: () => {
    const cart = loadCartFromStorage();
    set({ currentOrder: cart });
  },

  // User Management
  setUser: (user) => set({ user }),

  canCreateMenu: () => {
    const { user } = useAuthStore.getState();
    return ['headWaiter', 'admin', 'superAdmin'].includes(user?.role || '');
  },

  canPlaceOrder: () => {
    const { user } = useAuthStore.getState();
    return ['waiter', 'headWaiter','guest', 'admin', 'superAdmin'].includes(user?.role || '');
  },

  // Fetch Menu Items
  fetchMenuItems: async (category) => {
    set({ loading: true, error: null });
    try {
      const params = category ? { category } : {};
      const response = await api.get('/api/menu/all-items', { params });
      set({ menuItems: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch menu items', 
        loading: false 
      });
    }
  },

  // Create Menu Item (Head Waiter Only)
  createMenuItem: async (formData) => {
    const { canCreateMenu } = get();
    if (!canCreateMenu()) {
      set({ error: 'Unauthorized: Only head waiters can create menu items' });
      throw new Error('Unauthorized');
    }

    // Get user from authStore
    const { user } = useAuthStore.getState();
    
    if (!user?.hotelId) {
      set({ error: 'Hotel ID is required to create menu items' });
      throw new Error('Hotel ID missing');
    }

    // Ensure hotelId is in the formData (override if it exists)
    formData.set('hotelId', user.hotelId);

    set({ loading: true, error: null });
    try {
      const response = await api.post('/api/menu/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      set((state) => ({
        menuItems: [...state.menuItems, response.data.data],
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to create menu item', 
        loading: false 
      });
      throw error;
    }
  },

  // Update Menu Item (Head Waiter Only)
  updateMenuItem: async (id, data) => {
    const { canCreateMenu } = get();
    if (!canCreateMenu()) {
      set({ error: 'Unauthorized: Only head waiters can update menu items' });
      throw new Error('Unauthorized');
    }

    set({ loading: true, error: null });
    try {
      const response = await api.put(`/api/menu/${id}`, data);
      
      set((state) => ({
        menuItems: state.menuItems.map((item) =>
          item._id === id ? response.data.data : item
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to update menu item', 
        loading: false 
      });
      throw error;
    }
  },

  // Delete Menu Item (Head Waiter Only)
  deleteMenuItem: async (id) => {
    const { canCreateMenu } = get();
    if (!canCreateMenu()) {
      set({ error: 'Unauthorized: Only head waiters can delete menu items' });
      throw new Error('Unauthorized');
    }

    set({ loading: true, error: null });
    try {
      await api.delete(`/api/menu/${id}`);
      
      set((state) => ({
        menuItems: state.menuItems.filter((item) => item._id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to delete menu item', 
        loading: false 
      });
      throw error;
    }
  },

  // Add Images to Menu Item (Head Waiter Only)
  addMenuItemImages: async (id, formData) => {
    const { canCreateMenu } = get();
    if (!canCreateMenu()) {
      set({ error: 'Unauthorized: Only head waiters can add images' });
      throw new Error('Unauthorized');
    }

    set({ loading: true, error: null });
    try {
      const response = await api.post(`/api/menu/${id}/add-images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      set((state) => ({
        menuItems: state.menuItems.map((item) =>
          item._id === id ? response.data.data : item
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to add images', 
        loading: false 
      });
      throw error;
    }
  },

  // Delete Image from Menu Item (Head Waiter Only)
  deleteMenuItemImage: async (id, imagePath) => {
    const { canCreateMenu } = get();
    if (!canCreateMenu()) {
      set({ error: 'Unauthorized: Only head waiters can delete images' });
      throw new Error('Unauthorized');
    }

    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/api/menu/${id}/delete-image`, { imagePath });
      
      set((state) => ({
        menuItems: state.menuItems.map((item) =>
          item._id === id ? response.data.data : item
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to delete image', 
        loading: false 
      });
      throw error;
    }
  },

  // Add to Cart (with localStorage sync)
  addToCart: (item, quantity) => {
    set((state) => {
      const existingItem = state.currentOrder.find(
        (orderItem) => orderItem.menuItemId === item._id
      );

      let newCart: OrderItem[];
      
      if (existingItem) {
        newCart = state.currentOrder.map((orderItem) =>
          orderItem.menuItemId === item._id
            ? { ...orderItem, quantity: orderItem.quantity + quantity }
            : orderItem
        );
      } else {
        newCart = [
          ...state.currentOrder,
          {
            menuItemId: item._id,
            name: item.name,
            quantity,
            price: item.price,
          },
        ];
      }

      // Save to localStorage
      saveCartToStorage(newCart);
      
      return { currentOrder: newCart };
    });
  },

  // Remove from Cart (with localStorage sync)
  removeFromCart: (menuItemId) => {
    set((state) => {
      const newCart = state.currentOrder.filter(
        (item) => item.menuItemId !== menuItemId
      );
      
      // Save to localStorage
      saveCartToStorage(newCart);
      
      return { currentOrder: newCart };
    });
  },

  // Update Cart Quantity (with localStorage sync)
  updateCartQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(menuItemId);
      return;
    }

    set((state) => {
      const newCart = state.currentOrder.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      );
      
      // Save to localStorage
      saveCartToStorage(newCart);
      
      return { currentOrder: newCart };
    });
  },

  // Clear Cart (with localStorage sync)
  clearCart: () => {
    clearCartFromStorage();
    set({ currentOrder: [] });
  },

  // Create Order (with waiter assignment and order tracking)
  createOrder: async (orderData) => {
    const { canPlaceOrder, currentOrder } = get();
    const { user } = useAuthStore.getState();

    // console.log(user)
    
    if (!canPlaceOrder()) {
      set({ error: 'Unauthorized: You do not have permission to place orders' });
      throw new Error('Unauthorized');
    }

    if (currentOrder.length === 0) {
      set({ error: 'Cart is empty' });
      throw new Error('Cart is empty');
    }

    if (!user?.hotelId) {
      set({ error: 'Hotel ID is required to create order' });
      throw new Error('Hotel ID missing');
    }

    set({ loading: true, error: null });
    try {
      const response = await api.post('/api/orders', {
        ...orderData,
        items: currentOrder,
        hotelId: user.hotelId,
        waiterId: user._id, // Set logged-in user as waiter
      });

      const newOrder = response.data.data;

      // Add order ID to tracked list
      addOrderIdToStorage(newOrder._id);

      set((state) => ({
        orders: [newOrder, ...state.orders],
        trackedOrderIds: [newOrder._id, ...state.trackedOrderIds.filter(id => id !== newOrder._id)].slice(0, 50),
        currentOrder: [],
        loading: false,
      }));

      // Clear cart from localStorage
      clearCartFromStorage();

      return newOrder;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to create order', 
        loading: false 
      });
      throw error;
    }
  },

  // Fetch Orders
  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/orders/all-orders');
      set({ orders: response.data.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch orders', 
        loading: false 
      });
    }
  },

  // Update Order Status
  updateOrderStatus: async (orderId, status) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/api/orders/${orderId}/status`, { status });
      
      set((state) => ({
        orders: state.orders.map((order) =>
          order._id === orderId ? response.data.data : order
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to update order status', 
        loading: false 
      });
      throw error;
    }
  },

  // Update Order Payment Status
  updateOrderPaymentStatus: async (orderId, paymentStatus) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/api/orders/${orderId}/payment`, { paymentStatus });
      
      // Update the specific order in the orders array
      set((state) => ({
        orders: state.orders.map((order) =>
          order._id === orderId ? { ...order, paymentStatus: response.data.data.paymentStatus } : order
        ),
        loading: false,
      }));
      
      return response.data.data;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to update payment status', 
        loading: false 
      });
      throw error;
    }
  },

  // Track Orders by IDs
  trackOrders: async (orderIds) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/api/orders/track', { orderIds });
      set({ loading: false });
      return response.data.data;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to track orders', 
        loading: false 
      });
      throw error;
    }
  },

  // Load tracked orders from localStorage
  loadTrackedOrders: async () => {
    const { trackedOrderIds } = get();
    if (trackedOrderIds.length === 0) {
      return;
    }
    
    try {
      const orders = await get().trackOrders(trackedOrderIds);
      set({ orders });
    } catch (error) {
      console.error('Failed to load tracked orders:', error);
    }
  },

  // Add order ID to tracked list
  addTrackedOrderId: (orderId: string) => {
    addOrderIdToStorage(orderId);
    set((state) => ({
      trackedOrderIds: [orderId, ...state.trackedOrderIds.filter(id => id !== orderId)].slice(0, 50)
    }));
  },
}));