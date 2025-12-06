import { create } from 'zustand';
// import { BlogPost, BlogImage } from './useBlogStore';

export interface BlogImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
}

export interface BlogPost {
  _id: string;
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string; // Featured image
  images?: BlogImage[]; // Additional images in blog
  isLive: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
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
  // State
  posts: BlogPost[];
  loading: boolean;
  imageUploading: boolean;
  error: string | null;
  success: string | null;
  categories: string[];
  editingId: string | null;

  // Actions
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

export const useBlogAdminStore = create<BlogAdminStore>((set, get) => ({
  // Initial state
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

  // Fetch all blogs (including drafts) for admin
  fetchAllBlogs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/blogs/admin', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch blogs');
      }

      const data = await response.json();
      set({
        posts: data.posts,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
    }
  },

  // Create new blog post
  createBlog: async (data: BlogFormData, featuredImage: File) => {
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

      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create blog');
      }

      const result = await response.json();

      set((state) => ({
        posts: [result.post, ...state.posts],
        success: 'Blog created successfully!',
        loading: false,
      }));

      // Clear success message after 5 seconds
      setTimeout(() => set({ success: null }), 5000);

      return result.post._id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  // Update existing blog post
  updateBlog: async (id: string, data: BlogFormData, featuredImage?: File) => {
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

      const response = await fetch(`/api/blogs/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update blog');
      }

      const result = await response.json();

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === id ? result.post : post
        ),
        success: 'Blog updated successfully!',
        loading: false,
        editingId: null,
      }));

      // Clear success message after 5 seconds
      setTimeout(() => set({ success: null }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
    }
  },

  // Delete blog post
  deleteBlog: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete blog');
      }

      set((state) => ({
        posts: state.posts.filter((post) => post._id !== id),
        success: 'Blog deleted successfully!',
        loading: false,
      }));

      // Clear success message after 5 seconds
      setTimeout(() => set({ success: null }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
    }
  },

  // Toggle blog live/draft status
  toggleBlogLive: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const post = get().posts.find((p) => p._id === id);
      if (!post) throw new Error('Blog not found');

      const response = await fetch(`/api/blogs/${id}/toggle-live`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ isLive: !post.isLive }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle blog status');
      }

      const result = await response.json();

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === id ? result.post : post
        ),
        success: `Blog ${!post.isLive ? 'published' : 'unpublished'} successfully!`,
        loading: false,
      }));

      // Clear success message after 5 seconds
      setTimeout(() => set({ success: null }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
    }
  },

  // Set blog to live or draft
  setBlogLive: async (id: string, isLive: boolean) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/blogs/${id}/set-live`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ isLive }),
      });

      if (!response.ok) {
        throw new Error('Failed to set blog status');
      }

      const result = await response.json();

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === id ? result.post : post
        ),
        success: `Blog ${isLive ? 'published' : 'moved to draft'} successfully!`,
        loading: false,
      }));

      setTimeout(() => set({ success: null }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
    }
  },

  // Upload additional image to blog
  uploadBlogImage: async (blogId: string, image: File) => {
    set({ imageUploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch(`/api/blogs/${blogId}/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === blogId
            ? { ...post, images: result.images }
            : post
        ),
        imageUploading: false,
        success: 'Image uploaded successfully!',
      }));

      setTimeout(() => set({ success: null }), 5000);

      return result.image;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, imageUploading: false });
      return null;
    }
  },

  // Delete image from blog
  deleteBlogImage: async (blogId: string, imageId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/blogs/${blogId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      const result = await response.json();

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === blogId
            ? { ...post, images: result.images }
            : post
        ),
        success: 'Image deleted successfully!',
        loading: false,
      }));

      setTimeout(() => set({ success: null }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
    }
  },

  // Clear error and success messages
  clearMessages: () => {
    set({ error: null, success: null });
  },
}));