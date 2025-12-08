import React, { useState, useEffect } from 'react';
import { useBlogAdminStore } from '@/store/useBlogAdminStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trash2,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

// Toast Component
const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'warning';
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };

  const icons = {
    success: <CheckCircle size={20} className="text-green-600 flex-shrink-0" />,
    error: <XCircle size={20} className="text-red-600 flex-shrink-0" />,
    warning: <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />,
  };

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg border flex items-start gap-3 shadow-lg z-50 animate-in slide-in-from-top ${styles[type]}`}
    >
      {icons[type]}
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-current/50 hover:text-current ml-2 flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Delete Blog Confirmation Modal
const DeleteConfirmModal = ({
  isOpen,
  blogTitle,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean;
  blogTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl max-w-sm w-full border animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <Trash2 className="text-red-600" size={24} />
          </div>

          <h3 className="text-lg font-semibold text-center mb-2">Delete Blog</h3>

          <p className="text-sm text-muted-foreground text-center mb-6">
            Are you sure you want to delete <span className="font-medium text-foreground">"{blogTitle}"</span>? This action cannot be undone and will also delete all associated images.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ FIXED: Delete Image Confirmation Modal with higher z-index
const DeleteImageConfirmModal = ({
  isOpen,
  imageAlt,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean;
  imageAlt: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl max-w-sm w-full border animate-in fade-in zoom-in-95 duration-200 relative z-50">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <ImageIcon className="text-red-600" size={24} />
          </div>

          <h3 className="text-lg font-semibold text-center mb-2">Delete Image</h3>

          <p className="text-sm text-muted-foreground text-center mb-6">
            Are you sure you want to delete this image? 
            {imageAlt && (
              <span className="block mt-2 font-medium text-foreground">
                "{imageAlt}"
              </span>
            )}
            This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Blog Form Modal
const BlogFormModal = ({
  isOpen,
  blog,
  onSubmit,
  onCancel,
  isLoading,
}: {
  isOpen: boolean;
  blog?: any;
  onSubmit: (data: any, image?: File) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const { categories } = useBlogAdminStore();
  const [formData, setFormData] = useState({
    title: blog?.title || '',
    excerpt: blog?.excerpt || '',
    content: blog?.content || '',
    category: blog?.category || 'News',
    author: blog?.author || '',
    readTime: blog?.readTime || '5 min read',
    isLive: blog?.isLive || false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(blog?.image || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, selectedImage || undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border animate-in fade-in zoom-in-95 duration-200">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur z-10">
          <h2 className="text-xl font-bold">{blog ? 'Edit Blog' : 'Create New Blog'}</h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Featured Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Featured Image *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="imageInput"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-input rounded-lg cursor-pointer bg-accent/5 hover:bg-accent/10 hover:border-primary/50 transition-all"
                >
                  <Upload className="text-muted-foreground mb-2" size={24} />
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF</p>
                </label>
              </div>
              {imagePreview && (
                <div className="relative h-40 rounded-lg overflow-hidden border border-input">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Blog post title"
              className="w-full px-3 py-2 border text-black rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <label htmlFor="excerpt" className="text-sm font-medium">
              Excerpt *
            </label>
            <textarea
              id="excerpt"
              required
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short description (shown in list)"
              className="w-full px-3 py-2 border text-black rounded-md focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content *
            </label>
            <textarea
              id="content"
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Full blog content"
              className="w-full px-3 py-2 border text-black rounded-md focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border text-black rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Read Time */}
            <div className="space-y-2">
              <label htmlFor="readTime" className="text-sm font-medium">
                Read Time *
              </label>
              <input
                id="readTime"
                type="text"
                required
                value={formData.readTime}
                onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                placeholder="e.g., 5 min read"
                className="w-full px-3 py-2 text-black border rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* Author */}
          <div className="space-y-2">
            <label htmlFor="author" className="text-sm font-medium">
              Author *
            </label>
            <input
              id="author"
              type="text"
              required
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Author name"
              className="w-full px-3 py-2 border text-black rounded-md focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Publish Status */}
          <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-lg border border-accent/20">
            <input
              id="isLive"
              type="checkbox"
              checked={formData.isLive}
              onChange={(e) => setFormData({ ...formData, isLive: e.target.checked })}
              className="w-4 h-4 rounded border-input focus:ring-2 focus:ring-primary/20"
            />
            <label htmlFor="isLive" className="text-sm font-medium cursor-pointer">
              Publish immediately (Uncheck to save as draft)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  {blog ? 'Update Blog' : 'Create Blog'}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Blog Detail View Modal
const BlogDetailModal = ({
  isOpen,
  blog: initialBlog,
  onClose,
  onEdit,
  posts,
  onDeleteImageClick,
}: {
  isOpen: boolean;
  blog?: any;
  onClose: () => void;
  onEdit: (blog: any) => void;
  posts: any[];
  onDeleteImageClick: (imageId: string, imageAlt: string) => void;
}) => {
  const { uploadBlogImage, deleteBlogImage, loading, imageUploading } = useBlogAdminStore();
  const [blog, setBlog] = useState<any>(initialBlog);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ✅ Update blog when it changes in props or when posts change
  useEffect(() => {
    if (initialBlog && isOpen) {
      // Find the latest version of this blog from posts
      const updatedBlog = posts.find(p => p._id === initialBlog._id) || initialBlog;
      setBlog(updatedBlog);
    }
  }, [initialBlog, isOpen, posts]);

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && blog) {
      try {
        await uploadBlogImage(blog._id, file);
        // ✅ Clear the input after successful upload
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  if (!isOpen || !blog) return null;

  const imageUrl = blog.image?.startsWith('http') 
    ? blog.image 
    : `${(import.meta as any).env?.VITE_BACKEND_IMAGE_URL || 'http://localhost:5000'}${blog.image}`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl border animate-in fade-in zoom-in-95 duration-200 my-8 relative z-40">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-md transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold">{blog.title}</h2>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onEdit(blog);
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit2 size={16} className="mr-2" />
              Edit
            </Button>
            <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Featured Image */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Featured Image</h3>
            <img
              src={imageUrl}
              alt={blog.title}
              className="w-full h-64 object-cover rounded-lg border border-input"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 
                  'https://via.placeholder.com/800x400?text=Image+Not+Found';
              }}
            />
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-accent/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium text-sm">{blog.category}</p>
            </div>
            <div className="p-3 bg-accent/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Author</p>
              <p className="font-medium text-sm">{blog.author}</p>
            </div>
            <div className="p-3 bg-accent/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Read Time</p>
              <p className="font-medium text-sm">{blog.readTime}</p>
            </div>
            <div className="p-3 bg-accent/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Views</p>
              <p className="font-medium text-sm">{blog.views}</p>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Excerpt</h3>
            <p className="text-sm text-muted-foreground">{blog.excerpt}</p>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Content</h3>
            <div className="p-4 bg-accent/5 rounded-lg max-h-48 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{blog.content}</p>
            </div>
          </div>

          {/* Additional Images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Additional Images ({blog.images?.length || 0})</h3>
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAddImage}
                  disabled={imageUploading}
                  className="hidden"
                />
                <Button
                  disabled={imageUploading}
                  className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload size={14} className="mr-1" />
                  {imageUploading ? 'Uploading...' : 'Add Image'}
                </Button>
              </label>
            </div>

            {blog.images && blog.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {blog.images.map((img: any) => {
                  const imgUrl = img.url?.startsWith('http') 
                    ? img.url 
                    : `${(import.meta as any).env?.VITE_BACKEND_IMAGE_URL || 'http://localhost:5000'}${img.url}`;
                  return (
                    <div key={img.id} className="relative group">
                      <img
                        src={imgUrl}
                        alt={img.alt}
                        className="w-full h-32 object-cover rounded-lg border border-input"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 
                            'https://via.placeholder.com/300x200?text=Error';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center gap-2">
                        {/* ✅ FIXED: Call parent's onDeleteImageClick instead */}
                        <button
                          onClick={() => onDeleteImageClick(img.id, img.alt || 'Untitled Image')}
                          disabled={loading}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white disabled:opacity-50"
                          title="Delete image"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {img.alt && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{img.alt}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No additional images</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BlogManagement = () => {
  const {
    posts,
    loading,
    error,
    success,
    fetchAllBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    toggleBlogLive,
  } = useBlogAdminStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; blog: any | null }>({
    isOpen: false,
    blog: null,
  });
  const [deleteImageModal, setDeleteImageModal] = useState<{ isOpen: boolean; imageId: string | null; imageAlt: string }>({
    isOpen: false,
    imageId: null,
    imageAlt: '',
  });
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'draft'>('all');

  useEffect(() => {
    fetchAllBlogs();
  }, [fetchAllBlogs]);

  useEffect(() => {
    if (success) {
      setToastMessage({ message: success, type: 'success' });
      setShowCreateModal(false);
      setEditingBlog(null);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      setToastMessage({ message: error, type: 'error' });
    }
  }, [error]);

  // ✅ Update selectedBlog when posts change (for real-time updates)
  useEffect(() => {
    if (selectedBlog && posts.length > 0) {
      const updatedBlog = posts.find(p => p._id === selectedBlog._id);
      if (updatedBlog) {
        setSelectedBlog(updatedBlog);
      }
    }
  }, [posts]);

  const handleCreateBlog = async (formData: any, image?: File) => {
    if (!image) {
      setToastMessage({ message: 'Please select a featured image', type: 'error' });
      return;
    }
    await createBlog(formData, image);
  };

  const handleUpdateBlog = async (formData: any, image?: File) => {
    if (editingBlog) {
      await updateBlog(editingBlog._id, formData, image);
    }
  };

  const handleDeleteBlog = async () => {
    if (deleteModal.blog) {
      await deleteBlog(deleteModal.blog._id);
      setDeleteModal({ isOpen: false, blog: null });
    }
  };

  const handleToggleBlogLive = async (blog: any) => {
    await toggleBlogLive(blog._id);
  };

  // ✅ NEW: Handle delete image click
  const handleDeleteImageClick = (imageId: string, imageAlt: string) => {
    setDeleteImageModal({
      isOpen: true,
      imageId,
      imageAlt,
    });
  };

  // ✅ NEW: Confirm and delete image
  const handleConfirmDeleteImage = async () => {
    if (selectedBlog && deleteImageModal.imageId) {
      const { deleteBlogImage } = useBlogAdminStore.getState();
      await deleteBlogImage(selectedBlog._id, deleteImageModal.imageId);
      setDeleteImageModal({ isOpen: false, imageId: null, imageAlt: '' });
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    if (filterStatus === 'live') return post.isLive;
    if (filterStatus === 'draft') return !post.isLive;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* ✅ FIXED: Delete Image Modal - Outside of detail modal, higher z-index */}
      <DeleteImageConfirmModal
        isOpen={deleteImageModal.isOpen}
        imageAlt={deleteImageModal.imageAlt}
        onConfirm={handleConfirmDeleteImage}
        onCancel={() => setDeleteImageModal({ isOpen: false, imageId: null, imageAlt: '' })}
        isLoading={loading}
      />

      {/* Delete Blog Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        blogTitle={deleteModal.blog?.title || ''}
        onConfirm={handleDeleteBlog}
        onCancel={() => setDeleteModal({ isOpen: false, blog: null })}
        isLoading={loading}
      />

      {/* Create/Edit Modal */}
      <BlogFormModal
        isOpen={showCreateModal || !!editingBlog}
        blog={editingBlog}
        onSubmit={editingBlog ? handleUpdateBlog : handleCreateBlog}
        onCancel={() => {
          setShowCreateModal(false);
          setEditingBlog(null);
        }}
        isLoading={loading}
      />

      {/* Blog Detail Modal */}
      <BlogDetailModal
        isOpen={!!selectedBlog}
        blog={selectedBlog}
        onClose={() => setSelectedBlog(null)}
        onEdit={(blog) => setEditingBlog(blog)}
        posts={posts}
        onDeleteImageClick={handleDeleteImageClick}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground">Create and manage blog posts</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus size={20} className="mr-2" />
          Create Blog
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={filterStatus === 'all' ? 'border-primary border-2' : ''}>
          <CardContent className="pt-6">
            <button
              onClick={() => setFilterStatus('all')}
              className="w-full text-center hover:bg-accent/5 p-2 rounded transition-colors"
            >
              <div className="text-3xl font-bold">{posts.length}</div>
              <p className="text-muted-foreground mt-2 text-sm">Total Blogs</p>
            </button>
          </CardContent>
        </Card>
        <Card className={`${filterStatus === 'live' ? 'border-green-500 border-2' : ''} bg-green-50/50 border-green-200`}>
          <CardContent className="pt-6">
            <button
              onClick={() => setFilterStatus('live')}
              className="w-full text-center hover:bg-green-100/50 p-2 rounded transition-colors"
            >
              <div className="text-3xl font-bold text-green-600">
                {posts.filter((p) => p.isLive).length}
              </div>
              <p className="text-green-700 mt-2 text-sm">Published</p>
            </button>
          </CardContent>
        </Card>
        <Card className={`${filterStatus === 'draft' ? 'border-slate-500 border-2' : ''} bg-slate-50 border-slate-200`}>
          <CardContent className="pt-6">
            <button
              onClick={() => setFilterStatus('draft')}
              className="w-full text-center hover:bg-slate-100/50 p-2 rounded transition-colors"
            >
              <div className="text-3xl font-bold text-slate-700">
                {posts.filter((p) => !p.isLive).length}
              </div>
              <p className="text-muted-foreground mt-2 text-sm">Drafts</p>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Blogs Grid/List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterStatus === 'all' && 'All Blogs'}
            {filterStatus === 'live' && 'Published Blogs'}
            {filterStatus === 'draft' && 'Draft Blogs'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin mb-4 text-primary" size={32} />
              <p className="text-muted-foreground">Loading blogs...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blogs found. Create your first blog!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((blog) => {
                const imageUrl = blog.image?.startsWith('http') 
                  ? blog.image 
                  : `${(import.meta as any).env?.VITE_BACKEND_IMAGE_URL || 'http://localhost:5000'}${blog.image}`;
                return (
                  <div
                    key={blog._id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
                  >
                    {/* Image */}
                    <div className="relative h-40 bg-slate-200 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 
                            'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            blog.isLive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {blog.isLive ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold line-clamp-2">{blog.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{blog.date}</p>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {blog.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {blog.category}
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          👁 {blog.views}
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          📸 {blog.images?.length || 0}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <button
                          onClick={() => setSelectedBlog(blog)}
                          className="flex-1 p-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => handleToggleBlogLive(blog)}
                          disabled={loading}
                          className={`flex-1 p-2 rounded transition-colors flex items-center justify-center gap-1 text-xs font-medium disabled:opacity-50 ${
                            blog.isLive
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                          title={blog.isLive ? 'Unpublish' : 'Publish'}
                        >
                          {blog.isLive ? (
                            <>
                              <EyeOff size={14} />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye size={14} />
                              Publish
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingBlog(blog)}
                          className="p-2 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, blog })}
                          className="p-2 rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogManagement;