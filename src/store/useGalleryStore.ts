import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

interface GalleryImage {
  _id: string;
  images: string[];
  title: string;
  category: string;
  isLive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface GalleryStore {
  images: GalleryImage[];
  allImages: GalleryImage[];  // For admin - includes drafts
  categories: string[];
  loading: boolean;
  error: string | null;
  activeCategory: string;
  userRole: string | null;
  
  // Admin actions (superadmin only)
  fetchAllImagesAdmin: (category?: string) => Promise<void>;
  fetchCategoriesAdmin: () => Promise<void>;
  addImage: (formData: FormData) => Promise<void>;
  updateImage: (imageId: string, updates: Partial<GalleryImage>) => Promise<void>;
  toggleImageLive: (imageId: string) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  
  // Role management
  setUserRole: (role: string) => void;
//   isSuperAdmin: () => boolean;
}

export const useGalleryStore = create<GalleryStore>((set, get) => ({
  images: [],
  allImages: [],
  categories: [],
  loading: false,
  error: null,
  activeCategory: 'All',
  userRole: null,

  // ============= ADMIN ACTIONS =============
  
  fetchAllImagesAdmin: async (category?: string) => {
      // Note: In real app, trust the backend 403, but this early check is fine for UI state
      // We remove the strict get().isSuperAdmin() check here to allow the component to handle the UI state gracefully
      // letting the backend remain the source of truth for permission errors.
      const { token } = useAuthStore.getState();
    
    set({ loading: true, error: null });
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/gallery/admin/all`;
      if (category && category !== 'All') {
        url += `?category=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      

      if (!response.ok) {
        throw new Error('Failed to fetch admin images');
      }

      const data = await response.json();
      set({ allImages: data.data || [], loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: errorMessage, loading: false });
      console.error('Error fetching admin images:', error);
    }
  },

  fetchCategoriesAdmin: async () => {
    const { token } = useAuthStore.getState();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/gallery/admin/categories`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
            credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      const categoriesWithAll = ['All', ...data.data];
      set({ categories: categoriesWithAll });
    } catch (error) {
      console.error('Error fetching admin categories:', error);
      set({ categories: ['All', 'Rooms', 'Restaurant', 'Spa', 'Facilities'] });
    }
  },

  addImage: async (formData: FormData) => {
    // Basic check, backend validates
    // if (!get().isSuperAdmin()) {
    //   throw new Error('Only superadmin can upload images');
    // }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/gallery`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          },
          credentials: 'include',
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Only superadmin can upload images');
        }
        throw new Error('Failed to add image');
      }

      const data = await response.json();
      const newImage = data.data;
      
      // Add to allImages (admin view)
      set((state) => ({
        allImages: [newImage, ...state.allImages],
      }));

      // Refetch categories in case new category was added
      get().fetchCategoriesAdmin();
    } catch (error) {
      console.error('Error adding image:', error);
      throw error;
    }
  },

  updateImage: async (imageId: string, updates: Partial<GalleryImage>) => {
    // if (!get().isSuperAdmin()) {
    //   throw new Error('Only superadmin can update images');
    // }
    const { token } = useAuthStore.getState();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/gallery/${imageId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
            credentials: 'include',
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      const data = await response.json();
      const updatedImage = data.data;

      // Update in allImages
      set((state) => ({
        allImages: state.allImages.map((img) =>
          img._id === imageId ? updatedImage : img
        ),
      }));
    } catch (error) {
      console.error('Error updating image:', error);
      throw error;
    }
  },

  toggleImageLive: async (imageId: string) => {
    // if (!get().isSuperAdmin()) {
    //   throw new Error('Only superadmin can toggle image live status');
    // }
    const { token } = useAuthStore.getState();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/gallery/${imageId}/toggle-live`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
            credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle image live status');
      }

      const data = await response.json();
      const updatedImage = data.data;

      // Update in allImages
      set((state) => ({
        allImages: state.allImages.map((img) =>
          img._id === imageId ? updatedImage : img
        ),
      }));

    } catch (error) {
      console.error('Error toggling image live status:', error);
      throw error;
    }
  },

  deleteImage: async (imageId: string) => {
    // if (!get().isSuperAdmin()) {
    //   throw new Error('Only superadmin can delete images');
    // }

    const { token } = useAuthStore.getState();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/gallery/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
            credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Remove from lists
      set((state) => ({
        allImages: state.allImages.filter((img) => img._id !== imageId),
        images: state.images.filter((img) => img._id !== imageId),
      }));
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // ============= ROLE MANAGEMENT =============

  setUserRole: (role: string) => {
    set({ userRole: role });
  },

//   isSuperAdmin: () => {
//     const state = get();
//     return state.userRole === 'superadmin';
//   },
}));