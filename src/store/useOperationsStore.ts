// useOperationsStore.ts (Updated)
import { create } from 'zustand';
import io from 'socket.io-client';
import { useAuthStore } from './useAuthStore'; // ⚠️ Ensure this path points to your actual Auth Store
// --- 1. Type Definitions ---
interface RoomStatus {
    _id: string;
    roomNumber: string;
    status: 'occupied' | 'cleaning' | 'available' | 'maintenance';
    guestName?: string;
    checkOut?: string;
    roomTypeId: {
        _id: string;
        name: string;
    }
}
interface CleaningTask {
    _id: string;
    roomId: { _id: string, roomNumber: string };
    assignedCleaner: { name: string, email: string };
    status: 'pending' | 'in progress' | 'completed';
    createdAt: string;
}
interface RestaurantOrder {
    _id: string;
    tableNumber: number;
    items: { quantity: number }[];
    totalAmount: number;
    orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    createdAt: string;
    orderType: 'room service' | 'pickup' | 'table service';
}
export interface RoomDetails {
    _id: string;
    hotelId: string;
    name: string;
    roomNumber: string;
    description: string;
    amenities: string[];
    price: number;
    capacity: number;
    images: string[];
    isAvailable: boolean;
    createdAt: string;
}
// --- 2. Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const SOCKET_URL = API_BASE_URL;
const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
});
// --- 3. Store Interface ---
interface OperationsState {
    // Data
    roomsStatus: RoomStatus[];
    cleaningTasks: CleaningTask[];
    restaurantOrders: RestaurantOrder[];
    allRoomDetails: RoomDetails[];
    // UI State
    isLoading: boolean;
    error: string | null;
    isSubmitting: boolean;
    // Actions (No longer require context arguments)
    fetchOperationsData: () => Promise<void>;
   
    // Room Admin Actions
    fetchRoomDetails: () => Promise<void>;
    createRoom: (data: FormData) => Promise<void>;
    updateRoomText: (roomId: string, data: Partial<RoomDetails>) => Promise<void>;
    updateRoomImages: (roomId: string, images: File[]) => Promise<void>;
    deleteRoomImage: (roomId: string, imagePath: string) => Promise<void>;
    deleteRoom: (roomId: string) => Promise<void>;
    // Cleaning Actions
    assignCleaner: (roomId: string, assignedCleanerId: string) => Promise<void>;
    // Socket.IO
    connectSocket: () => void;
    disconnectSocket: () => void;
}
// --- 4. Helper to get Auth Headers securely ---
const getAuthHeaders = () => {
    const { user } = useAuthStore.getState();
    if (!user?.token || !user?.hotelId) {
        throw new Error("Authentication missing. Please log in.");
    }
    return {
        token: user.token,
        hotelId: user.hotelId,
        headers: {
            'Authorization': `Bearer ${user.token}`
        }
    };
};
// --- 5. Store Implementation ---
export const useOperationsStore = create<OperationsState>((set, get) => ({
    roomsStatus: [],
    cleaningTasks: [],
    restaurantOrders: [],
    allRoomDetails: [],
    isLoading: false,
    error: null,
    isSubmitting: false,
    fetchOperationsData: async () => {
        set({ isLoading: true, error: null });
        try {
            const { hotelId, headers } = getAuthHeaders(); // Get real data
            // 1. Fetch Room Status
            const roomsRes = await fetch(`${API_BASE_URL}/api/rooms/by-hotel/${hotelId}`, { headers });
            if (!roomsRes.ok) throw new Error('Failed to fetch rooms status');
            const roomsData = await roomsRes.json();
            // 2. Fetch Cleaning Tasks
            const cleaningRes = await fetch(`${API_BASE_URL}/api/cleaning/hotel`, { headers });
            if (!cleaningRes.ok) throw new Error('Failed to fetch cleaning tasks');
            const cleaningData = await cleaningRes.json();
            // 3. Fetch Restaurant Orders
            const ordersRes = await fetch(`${API_BASE_URL}/api/orders/all-orders`, { headers });
            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            const ordersData = await ordersRes.json();
            set({
                roomsStatus: roomsData.rooms || [],
                cleaningTasks: cleaningData || [],
                restaurantOrders: ordersData.data || [],
                isLoading: false,
            });
        } catch (err) {
            console.error(err);
            set({ error: (err as Error).message, isLoading: false });
        }
    },
    fetchRoomDetails: async () => {
        set({ isLoading: true, error: null });
        try {
            const { hotelId, headers } = getAuthHeaders();
           
            const res = await fetch(`${API_BASE_URL}/api/rooms/types/by-hotel/${hotelId}`, { headers });
            if (!res.ok) throw new Error('Failed to fetch full room details');
           
            const data = await res.json();
            // No need for client-side filter; backend handles it
            set({ allRoomDetails: data.data || [], isLoading: false });
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
        }
    },
    createRoom: async (formData) => {
        set({ isSubmitting: true, error: null });
        try {
            const { headers } = getAuthHeaders();
            // Note: When sending FormData, do NOT set Content-Type header manually
            const { 'Content-Type': _, ...authHeadersOnly } = headers as any;
            const res = await fetch(`${API_BASE_URL}/api/rooms/create-room`, {
                method: 'POST',
                headers: { 'Authorization': headers['Authorization'] },
                body: formData,
            });
            if (!res.ok) throw new Error(`Creation failed: ${(await res.json()).error}`);
           
            // Refresh data
            await get().fetchRoomDetails();
            await get().fetchOperationsData();
            set({ isSubmitting: false });
        } catch (err) {
            set({ error: (err as Error).message, isSubmitting: false });
        }
    },
    updateRoomText: async (roomId, data) => {
        set({ isSubmitting: true, error: null });
        try {
            const { headers } = getAuthHeaders();
            const res = await fetch(`${API_BASE_URL}/api/rooms/update-room/${roomId}`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`Update failed: ${(await res.json()).error}`);
           
            await get().fetchRoomDetails();
            set({ isSubmitting: false });
        } catch (err) {
            set({ error: (err as Error).message, isSubmitting: false });
        }
    },
    updateRoomImages: async (roomId, files) => {
        set({ isSubmitting: true, error: null });
        try {
            const { headers } = getAuthHeaders();
            const formData = new FormData();
            files.forEach(file => formData.append('images', file));
            const res = await fetch(`${API_BASE_URL}/api/rooms/add-images/${roomId}`, {
                method: 'POST',
                headers: { 'Authorization': headers['Authorization'] },
                body: formData,
            });
            if (!res.ok) throw new Error(`Image update failed: ${(await res.json()).error}`);
           
            await get().fetchRoomDetails();
            set({ isSubmitting: false });
        } catch (err) {
            set({ error: (err as Error).message, isSubmitting: false });
        }
    },
    deleteRoomImage: async (roomId, imagePath) => {
        set({ isSubmitting: true, error: null });
        try {
            const { headers } = getAuthHeaders();
            const res = await fetch(`${API_BASE_URL}/api/rooms/delete-image/${roomId}`, {
                method: 'PATCH',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ imagePath }),
            });
            if (!res.ok) throw new Error(`Image deletion failed: ${(await res.json()).error}`);
           
            await get().fetchRoomDetails();
            set({ isSubmitting: false });
        } catch (err) {
            set({ error: (err as Error).message, isSubmitting: false });
        }
    },
    deleteRoom: async (roomId) => {
        set({ isSubmitting: true, error: null });
        try {
            const { headers } = getAuthHeaders();
            const res = await fetch(`${API_BASE_URL}/api/rooms/delete-room/${roomId}`, {
                method: 'DELETE',
                headers: headers,
            });
            if (!res.ok) throw new Error(`Deletion failed: ${(await res.json()).error}`);
           
            await get().fetchRoomDetails();
            await get().fetchOperationsData();
            set({ isSubmitting: false });
        } catch (err) {
            set({ error: (err as Error).message, isSubmitting: false });
        }
    },
    assignCleaner: async (roomId, assignedCleanerId) => {
        set({ isSubmitting: true, error: null });
        try {
            const { headers } = getAuthHeaders();
            const res = await fetch(`${API_BASE_URL}/api/cleaning`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, assignedCleanerId }),
            });
            if (!res.ok) throw new Error(`Assignment failed: ${(await res.json()).message}`);
           
            set({ isSubmitting: false });
        } catch (err) {
            set({ error: (err as Error).message, isSubmitting: false });
        }
    },
    connectSocket: () => {
        try {
            const { hotelId } = getAuthHeaders(); // Will throw if not logged in
           
            if (!hotelId) return;
           
            if (socket.connected && (socket.io.opts.query as { hotelId: string })?.hotelId === hotelId) {
                return;
            }
            socket.io.opts.query = { hotelId };
            socket.connect();
           
            socket.on('cleaning:update', (updatedTasks: CleaningTask[]) => {
                console.log('Real-time update received:', updatedTasks);
                set({ cleaningTasks: updatedTasks });
            });
            socket.on('connect', () => console.log(`Socket connected: ${hotelId}`));
            socket.on('disconnect', () => console.log('Socket disconnected'));
           
        } catch (e) {
            console.warn("Socket connection skipped: User not authenticated");
        }
    },
    disconnectSocket: () => {
        if (socket.connected) {
            socket.off('cleaning:update');
            socket.disconnect();
        }
    },
}));