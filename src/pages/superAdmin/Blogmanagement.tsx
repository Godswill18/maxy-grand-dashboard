import React, { useState, useEffect } from 'react';
import { useBlogAdminStore } from '@/store/useBlogAdminStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Trash2,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Delete Blog Confirmation ──────────────────────────────────────────────────

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
}) => (
  <AlertDialog open={isOpen} onOpenChange={onCancel}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
        <AlertDialogDescription>
          <strong>"{blogTitle}"</strong> will be permanently deleted along with all associated
          images. This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting…
            </>
          ) : (
            'Delete Post'
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// ── Delete Image Confirmation ─────────────────────────────────────────────────

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
}) => (
  <AlertDialog open={isOpen} onOpenChange={onCancel}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete image?</AlertDialogTitle>
        <AlertDialogDescription>
          {imageAlt && <strong>"{imageAlt}"</strong>} This image will be permanently removed.
          This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting…
            </>
          ) : (
            'Delete Image'
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// ── Blog Form Modal ───────────────────────────────────────────────────────────

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
    title:     blog?.title     || '',
    excerpt:   blog?.excerpt   || '',
    content:   blog?.content   || '',
    category:  blog?.category  || 'News',
    author:    blog?.author    || '',
    readTime:  blog?.readTime  || '5 min read',
    isLive:    blog?.isLive    || false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(blog?.image || '');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title:    blog?.title    || '',
        excerpt:  blog?.excerpt  || '',
        content:  blog?.content  || '',
        category: blog?.category || 'News',
        author:   blog?.author   || '',
        readTime: blog?.readTime || '5 min read',
        isLive:   blog?.isLive   || false,
      });
      setSelectedImage(null);
      setImagePreview(blog?.image || '');
    }
  }, [isOpen, blog]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData, selectedImage || undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{blog ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Featured Image */}
          <div className="space-y-2">
            <Label>Featured Image {!blog && '*'}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input id="blogImageInput" type="file" accept="image/*"
                  onChange={handleImageChange} className="hidden" />
                <label htmlFor="blogImageInput"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all">
                  <Upload className="text-muted-foreground mb-2 h-6 w-6" />
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF</p>
                </label>
              </div>
              {imagePreview && (
                <div className="relative h-40 rounded-lg overflow-hidden border border-input">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="blog-title">Title *</Label>
            <Input id="blog-title" required placeholder="Blog post title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <Label htmlFor="blog-excerpt">Excerpt *</Label>
            <Textarea id="blog-excerpt" required rows={3}
              placeholder="Short description (shown in list)"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="blog-content">Content *</Label>
            <Textarea id="blog-content" required rows={6}
              placeholder="Full blog content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Read Time */}
            <div className="space-y-1.5">
              <Label htmlFor="blog-readtime">Read Time *</Label>
              <Input id="blog-readtime" required placeholder="e.g. 5 min read"
                value={formData.readTime}
                onChange={(e) => setFormData({ ...formData, readTime: e.target.value })} />
            </div>
          </div>

          {/* Author */}
          <div className="space-y-1.5">
            <Label htmlFor="blog-author">Author *</Label>
            <Input id="blog-author" required placeholder="Author name"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Publish immediately</p>
              <p className="text-xs text-muted-foreground">Uncheck to save as draft</p>
            </div>
            <Switch checked={formData.isLive}
              onCheckedChange={(v) => setFormData({ ...formData, isLive: v })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            ) : (
              blog ? 'Save Changes' : 'Create Blog'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Blog Detail Modal ─────────────────────────────────────────────────────────

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
  const { uploadBlogImage, loading, imageUploading } = useBlogAdminStore();
  const [blog, setBlog] = useState<any>(initialBlog);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialBlog && isOpen) {
      const updated = posts.find((p) => p._id === initialBlog._id) || initialBlog;
      setBlog(updated);
    }
  }, [initialBlog, isOpen, posts]);

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && blog) {
      try {
        await uploadBlogImage(blog._id, file);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch {
        // error handled by store → toast via useEffect in parent
      }
    }
  };

  if (!blog) return null;

  const BACKEND_IMAGE = (import.meta as any).env?.VITE_BACKEND_IMAGE_URL || 'http://localhost:5000';
  const imageUrl = blog.image?.startsWith('http') ? blog.image : `${BACKEND_IMAGE}${blog.image}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap pr-6">
            <DialogTitle className="text-xl leading-tight">{blog.title}</DialogTitle>
            <Button size="sm" onClick={() => { onEdit(blog); onClose(); }} className="shrink-0">
              <Edit2 className="h-4 w-4 mr-1.5" /> Edit Post
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Featured Image */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Featured Image</p>
            <img src={imageUrl} alt={blog.title}
              className="w-full h-64 object-cover rounded-lg border border-input"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
              }} />
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Category',  value: blog.category },
              { label: 'Author',    value: blog.author },
              { label: 'Read Time', value: blog.readTime },
              { label: 'Views',     value: blog.views },
            ].map((m) => (
              <div key={m.label} className="p-3 bg-muted/40 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{m.label}</p>
                <p className="font-medium text-sm mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Excerpt */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Excerpt</p>
            <p className="text-sm text-muted-foreground">{blog.excerpt}</p>
          </div>

          {/* Content */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Content</p>
            <div className="p-4 bg-muted/40 rounded-lg max-h-48 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{blog.content}</p>
            </div>
          </div>

          {/* Additional Images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Additional Images ({blog.images?.length || 0})
              </p>
              <input ref={fileInputRef} type="file" accept="image/*"
                onChange={handleAddImage} disabled={imageUploading} className="hidden" />
              <Button size="sm" variant="outline" disabled={imageUploading}
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {imageUploading ? 'Uploading…' : 'Add Image'}
              </Button>
            </div>
            {blog.images && blog.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {blog.images.map((img: any) => {
                  const imgUrl = img.url?.startsWith('http') ? img.url : `${BACKEND_IMAGE}${img.url}`;
                  return (
                    <div key={img.id} className="relative group">
                      <img src={imgUrl} alt={img.alt}
                        className="w-full h-32 object-cover rounded-lg border border-input"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Error'; }} />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center">
                        <button onClick={() => onDeleteImageClick(img.id, img.alt || 'Untitled Image')}
                          disabled={loading}
                          className="p-2 bg-destructive hover:bg-destructive/90 rounded-lg text-white disabled:opacity-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {img.alt && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{img.alt}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg bg-muted/20 gap-2 text-muted-foreground">
                <ImageIcon className="h-6 w-6 opacity-40" />
                <p className="text-sm">No additional images</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

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
    clearMessages,
  } = useBlogAdminStore();

  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [editingBlog, setEditingBlog]           = useState<any>(null);
  const [selectedBlog, setSelectedBlog]         = useState<any>(null);
  const [deleteModal, setDeleteModal]           = useState<{ isOpen: boolean; blog: any | null }>({ isOpen: false, blog: null });
  const [deleteImageModal, setDeleteImageModal] = useState<{ isOpen: boolean; imageId: string | null; imageAlt: string }>({ isOpen: false, imageId: null, imageAlt: '' });
  const [filterStatus, setFilterStatus]         = useState<'all' | 'live' | 'draft'>('all');

  useEffect(() => { fetchAllBlogs(); }, [fetchAllBlogs]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      clearMessages();
      setShowCreateModal(false);
      setEditingBlog(null);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearMessages();
    }
  }, [error]);

  // Keep selectedBlog in sync with store updates
  useEffect(() => {
    if (selectedBlog && posts.length > 0) {
      const updated = posts.find((p) => p._id === selectedBlog._id);
      if (updated) setSelectedBlog(updated);
    }
  }, [posts]);

  const handleCreateBlog = async (formData: any, image?: File) => {
    if (!image) { toast.error('Please select a featured image'); return; }
    await createBlog(formData, image);
  };

  const handleUpdateBlog = async (formData: any, image?: File) => {
    if (editingBlog) await updateBlog(editingBlog._id, formData, image);
  };

  const handleDeleteBlog = async () => {
    if (deleteModal.blog) {
      await deleteBlog(deleteModal.blog._id);
      setDeleteModal({ isOpen: false, blog: null });
    }
  };

  const handleDeleteImageClick = (imageId: string, imageAlt: string) => {
    setDeleteImageModal({ isOpen: true, imageId, imageAlt });
  };

  const handleConfirmDeleteImage = async () => {
    if (selectedBlog && deleteImageModal.imageId) {
      const { deleteBlogImage } = useBlogAdminStore.getState();
      await deleteBlogImage(selectedBlog._id, deleteImageModal.imageId);
      setDeleteImageModal({ isOpen: false, imageId: null, imageAlt: '' });
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (filterStatus === 'live')  return p.isLive;
    if (filterStatus === 'draft') return !p.isLive;
    return true;
  });

  const BACKEND_IMAGE = (import.meta as any).env?.VITE_BACKEND_IMAGE_URL || 'http://localhost:5000';

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Modals */}
      <DeleteImageConfirmModal
        isOpen={deleteImageModal.isOpen}
        imageAlt={deleteImageModal.imageAlt}
        onConfirm={handleConfirmDeleteImage}
        onCancel={() => setDeleteImageModal({ isOpen: false, imageId: null, imageAlt: '' })}
        isLoading={loading}
      />
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        blogTitle={deleteModal.blog?.title || ''}
        onConfirm={handleDeleteBlog}
        onCancel={() => setDeleteModal({ isOpen: false, blog: null })}
        isLoading={loading}
      />
      <BlogFormModal
        isOpen={showCreateModal || !!editingBlog}
        blog={editingBlog}
        onSubmit={editingBlog ? handleUpdateBlog : handleCreateBlog}
        onCancel={() => { setShowCreateModal(false); setEditingBlog(null); }}
        isLoading={loading}
      />
      <BlogDetailModal
        isOpen={!!selectedBlog}
        blog={selectedBlog}
        onClose={() => setSelectedBlog(null)}
        onEdit={(b) => setEditingBlog(b)}
        posts={posts}
        onDeleteImageClick={handleDeleteImageClick}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Blog Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage blog posts</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Create Blog
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Posts',  value: posts.length,                        color: 'text-foreground', bg: 'bg-muted',    border: 'border-l-gray-400',  icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
          { label: 'Published',    value: posts.filter((p) => p.isLive).length, color: 'text-green-600',  bg: 'bg-green-50', border: 'border-l-green-400', icon: <Eye     className="h-5 w-5 text-green-500" /> },
          { label: 'Drafts',       value: posts.filter((p) => !p.isLive).length,color: 'text-amber-600',  bg: 'bg-amber-50', border: 'border-l-amber-400', icon: <EyeOff  className="h-5 w-5 text-amber-500" /> },
        ].map((s) => (
          <Card key={s.label} className={cn('border-l-4', s.border)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', s.bg)}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                <p className={cn('text-2xl font-bold leading-tight', s.color)}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {(['all', 'live', 'draft'] as const).map((f) => {
          const count = f === 'all' ? posts.length : f === 'live' ? posts.filter((p) => p.isLive).length : posts.filter((p) => !p.isLive).length;
          const label = f === 'live' ? 'Published' : f.charAt(0).toUpperCase() + f.slice(1);
          return (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border',
                filterStatus === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
              )}>
              {label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Blog Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {filterStatus === 'all' ? 'All Blog Posts' : filterStatus === 'live' ? 'Published Posts' : 'Draft Posts'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading */}
          {loading && posts.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-44 w-full rounded-none" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex gap-2 pt-2 border-t">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filteredPosts.length === 0 && (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">No blog posts found</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {filterStatus !== 'all'
                      ? 'No posts match the current filter.'
                      : 'Create your first blog post to get started.'}
                  </p>
                </div>
                {filterStatus !== 'all' ? (
                  <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')}>Show All</Button>
                ) : (
                  <Button size="sm" onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Blog
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Grid */}
          {filteredPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((blog) => {
                const imageUrl = blog.image?.startsWith('http')
                  ? blog.image
                  : `${BACKEND_IMAGE}${blog.image}`;
                return (
                  <Card key={blog._id} className="overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image */}
                    <div className="relative h-44 bg-muted overflow-hidden">
                      <img src={imageUrl} alt={blog.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'; }} />
                      <div className="absolute top-2 right-2">
                        <Badge className={cn(
                          'text-xs border',
                          blog.isLive
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {blog.isLive ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold line-clamp-2 leading-snug">{blog.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {blog.author} · {blog.date}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{blog.excerpt}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{blog.category}</Badge>
                        <span className="text-xs text-muted-foreground">{blog.views} views</span>
                        <span className="text-xs text-muted-foreground">{blog.images?.length || 0} images</span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1"
                          onClick={() => setSelectedBlog(blog)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        <Button
                          variant={blog.isLive ? 'secondary' : 'outline'}
                          size="sm" className="flex-1"
                          onClick={() => toggleBlogLive(blog._id)} disabled={loading}>
                          {blog.isLive
                            ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Unpublish</>
                            : <><Eye    className="h-3.5 w-3.5 mr-1" />Publish</>}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingBlog(blog)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteModal({ isOpen: true, blog })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
