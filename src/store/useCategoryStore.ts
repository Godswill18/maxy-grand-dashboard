import { create } from 'zustand';
import axios, { AxiosError } from 'axios';

export interface Category {
    _id: string;
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    roomCount?: number;
    createdAt: string;
    updatedAt: string;
}

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    fetchCategories: () => Promise<void>;
    fetchCategoriesAdmin: () => Promise<void>;
    createCategory: (data: { name: string; description?: string }) => Promise<{ success: boolean; error?: string }>;
    updateCategory: (id: string, data: Partial<Pick<Category, 'name' | 'description' | 'isActive'>>) => Promise<{ success: boolean; error?: string }>;
    deleteCategory: (id: string, reassignTo?: string) => Promise<{ success: boolean; error?: string }>;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
const getToken = () => sessionStorage.getItem('token');

export const useCategoryStore = create<CategoryState>((set) => ({
    categories: [],
    isLoading: false,
    error: null,

    fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.get(`${VITE_API_URL}/api/room-categories`, { withCredentials: true });
            set({ categories: res.data.data, isLoading: false });
        } catch (err) {
            set({ error: (err as AxiosError).message, isLoading: false });
        }
    },

    fetchCategoriesAdmin: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = getToken();
            const res = await axios.get(`${VITE_API_URL}/api/room-categories/admin`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                withCredentials: true,
            });
            set({ categories: res.data.data, isLoading: false });
        } catch (err) {
            set({ error: (err as AxiosError).message, isLoading: false });
        }
    },

    createCategory: async (data) => {
        try {
            const token = getToken();
            const res = await axios.post(`${VITE_API_URL}/api/room-categories`, data, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                withCredentials: true,
            });
            const newCat = res.data.data;
            set((state) => ({ categories: [...state.categories, { ...newCat, roomCount: 0 }] }));
            return { success: true };
        } catch (err) {
            const error = err as AxiosError<any>;
            return { success: false, error: error.response?.data?.error || error.message };
        }
    },

    updateCategory: async (id, data) => {
        try {
            const token = getToken();
            const res = await axios.put(`${VITE_API_URL}/api/room-categories/${id}`, data, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                withCredentials: true,
            });
            const updated = res.data.data;
            set((state) => ({
                categories: state.categories.map((c) =>
                    c._id === id ? { ...c, ...updated } : c
                ),
            }));
            return { success: true };
        } catch (err) {
            const error = err as AxiosError<any>;
            return { success: false, error: error.response?.data?.error || error.message };
        }
    },

    deleteCategory: async (id, reassignTo) => {
        try {
            const token = getToken();
            await axios.delete(`${VITE_API_URL}/api/room-categories/${id}`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                data: reassignTo ? { reassignTo } : {},
                withCredentials: true,
            });
            set((state) => ({ categories: state.categories.filter((c) => c._id !== id) }));
            return { success: true };
        } catch (err) {
            const error = err as AxiosError<any>;
            return { success: false, error: error.response?.data?.error || error.message };
        }
    },
}));
