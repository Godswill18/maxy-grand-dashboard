import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export interface BlogImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
}

export interface BlogPost {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  images?: BlogImage[];
  isLive: boolean;
  views: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  readTime: string;
  isLive: boolean;
}

interface BlogAdminStore {
  posts: BlogPost[];
  loading: boolean;
  imageUploading: boolean;
  error: string | null;
  success: string | null;
  categories: string[];
  editingId: string | null;

  fetchAllBlogs: () => Promise<void>;
  createBlog: (data: BlogFormData, featuredImage: File) => Promise<string | null>;
  updateBlog: (id: string, data: BlogFormData, featuredImage?: File) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;
  toggleBlogLive: (id: string) => Promise<void>;
  uploadBlogImage: (blogId: string, image: File) => Promise<BlogImage | null>;
  deleteBlogImage: (blogId: string, imageId: string) => Promise<void>;
  setBlogLive: (id: string, isLive: boolean) => Promise<void>;
  clearMessages: () => void;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
const getToken = () => sessionStorage.getItem('token');

// Helper function to handle API errors
const handleApiError = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    if (contentType?.includes('application/json')) {
      try {
        const data = await response.json();
        return data.error || `Error: ${response.statusText}`;
      } catch {
        return `Error: ${response.statusText} (${response.status})`;
      }
    } else {
      return `Error: ${response.statusText} (${response.status})`;
    }
  }
  
  return null;
};

export const useBlogAdminStore = create<BlogAdminStore>((set, get) => ({
  posts: [],
  loading: false,
  imageUploading: false,
  error: null,
  success: null,
  categories: [
    'News',
    'Events',
    'Tips & Guides',
    'Promotions',
    'Room Updates',
    'Other',
  ],
  editingId: null,

  // Fetch all blogs
  fetchAllBlogs: async () => {
    const token = getToken();

    // if (!token) {
    //   set({ error: 'No authentication token found', loading: false });
    //   return;
    // }

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/blogs/admin`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const apiError = await handleApiError(response);
      if (apiError) {
        throw new Error(apiError);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch blogs');
      }

      set({
        posts: data.posts || [],
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Fetch blogs error:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  // Create new blog
  createBlog: async (data: BlogFormData, featuredImage: File) => {
    const token = getToken();

    // if (!token) {
    //   set({ error: 'No authentication token found', loading: false });
    //   return null;
    // }

    if (!featuredImage) {
      set({ error: 'Featured image is required', loading: false });
      return null;
    }

    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('excerpt', data.excerpt);
      formData.append('content', data.content);
      formData.append('category', data.category);
      formData.append('author', data.author);
      formData.append('readTime', data.readTime);
      formData.append('isLive', String(data.isLive));
      formData.append('image', featuredImage);

      const response = await fetch(`${VITE_API_URL}/api/blogs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });

      const apiError = await handleApiError(response);
      if (apiError) {
        throw new Error(apiError);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create blog');
      }

      set((state) => ({
        posts: [result.post, ...state.posts],
        success: result.message || 'Blog created successfully!',
        loading: false,
      }));

      setTimeout(() => set({ success: null }), 5000);
      return result.post._id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Create blog error:', errorMessage);
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  // Update blog
  updateBlog: async (id: string, data: BlogFormData, featuredImage?: File) => {
    const token = getToken();

    // if (!token) {
    //   set({ error: 'No authentication token found', loading: false });
    //   return;
    // }

    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('excerpt', data.excerpt);
      formData.append('content', data.content);
      formData.append('category', data.category);
      formData.append('author', data.author);
      formData.append('readTime', data.readTime);
      formData.append('isLive', String(data.isLive));
      if (featuredImage) {
        formData.append('image', featuredImage);
      }

      const response = await fetch(`${VITE_API_URL}/api/blogs/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });

      const apiError = await handleApiError(response);
      if (apiError) {
        throw new Error(apiError);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update blog');
      }

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === id ? result.post : post
        ),
        success: result.message || 'Blog updated successfully!',
        loading: false,
        editingId: null,
      }));

      setTimeout(() => set({ success: null }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Update blog error:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  // Delete blog (also deletes all associated images)
  deleteBlog: async (id: string) => {
    const token = getToken();

    // if (!token) {
    //   set({ error: 'No authentication token found', loading: false });
    //   return;
    // }

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const apiError = await handleApiError(response);
      if (apiError) {
        throw new Error(apiError);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete blog');
      }

      set((state) => ({
        posts: state.posts.filter((post) => post._id !== id),
        success: result.message || 'Blog and all associated images deleted successfully!',
        loading: false,
      }));

      setTimeout(() => set({ success: null }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Delete blog error:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  // ✅ Fixed: Properly toggle blog live/draft status
   toggleBlogLive: async (id: string) => {
  const token = getToken();

  set({ loading: true, error: null });
  try {
    const post = get().posts.find((p) => p._id === id);
    if (!post) throw new Error('Blog not found');

    // ✅ IMPORTANT: Send the CURRENT status, let backend toggle it
    // NOT the new status!

    const response = await fetch(`${VITE_API_URL}/api/blogs/${id}/toggle-live`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      // ✅ Send current status (not toggled) - backend will toggle it
      body: JSON.stringify({ isLive: post.isLive }),
    });

    const apiError = await handleApiError(response);
    if (apiError) {
      throw new Error(apiError);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to toggle blog status');
    }


    set((state) => ({
      posts: state.posts.map((p) =>
        p._id === id ? result.post : p
      ),
      success: result.message || `Blog ${result.post.isLive ? 'published' : 'unpublished'} successfully!`,
      loading: false,
    }));

    setTimeout(() => set({ success: null }), 5000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Toggle blog error:', errorMessage);
    set({ error: errorMessage, loading: false });
  }
  },

  // Set blog live/draft
  setBlogLive: async (id: string, isLive: boolean) => {
    const token = getToken();

    // if (!token) {
    //   set({ error: 'No authentication token found', loading: false });
    //   return;
    // }

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/blogs/${id}/set-live`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ isLive }),
      });

      const apiError = await handleApiError(response);
      if (apiError) {
        throw new Error(apiError);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to set blog status');
      }

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === id ? result.post : post
        ),
        success: result.message || `Blog ${isLive ? 'published' : 'moved to draft'} successfully!`,
        loading: false,
      }));

      setTimeout(() => set({ success: null }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Set blog live error:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  // Upload blog image
  uploadBlogImage: async (blogId: string, image: File) => {
    const token = getToken();

    if (!token) {
      set({ error: 'No authentication token found', imageUploading: false });
      return null;
    }

    set({ imageUploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch(`${VITE_API_URL}/api/blogs/${blogId}/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });

      

      const apiError = await handleApiError(response);
      if (apiError) {
        throw new Error(apiError);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === blogId
            ? { ...post, images: result.images }
            : post
        ),
        imageUploading: false,
        success: result.message || 'Image uploaded successfully!',
      }));

      setTimeout(() => set({ success: null }), 5000);
      return result.image;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Upload image error:', errorMessage);
      set({ error: errorMessage, imageUploading: false });
      return null;
    }
  },

  // Delete blog image
  deleteBlogImage: async (blogId: string, imageId: string) => {
    const token = getToken();

    // if (!token) {
    //   set({ error: 'No authentication token found', loading: false });
    //   return;
    // }

    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${VITE_API_URL}/api/blogs/${blogId}/images/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      const apiError = await handleApiError(response);
      if (apiError) {
        throw new Error(apiError);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete image');
      }

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === blogId
            ? { ...post, images: result.images }
            : post
        ),
        success: result.message || 'Image deleted successfully!',
        loading: false,
      }));

      setTimeout(() => set({ success: null }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Delete image error:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  // Clear messages
  clearMessages: () => {
    set({ error: null, success: null });
  },
}));