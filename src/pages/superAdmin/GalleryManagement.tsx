import React, { useState, useEffect } from 'react';
import { useGalleryStore } from '@/store/useGalleryStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trash2, 
  Upload, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Edit2, 
  X,
  Plus,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

// Toast Component
const Toast = ({ 
  message, 
  type = 'success',
  onClose 
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
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  };

  const icons = {
    success: <CheckCircle size={20} className="text-green-600 flex-shrink-0" />,
    error: <XCircle size={20} className="text-red-600 flex-shrink-0" />,
    warning: <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
  };

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg border flex items-start gap-3 shadow-lg z-50 animate-in slide-in-from-top ${styles[type]}`}>
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

// Delete Confirmation Modal
const DeleteConfirmModal = ({
  isOpen,
  title,
  imageName,
  onConfirm,
  onCancel,
  isLoading
}: {
  isOpen: boolean;
  title: string;
  imageName: string;
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
          
          <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>
          
          <p className="text-sm text-muted-foreground text-center mb-6">
            Are you sure you want to delete <span className="font-medium text-foreground">"{imageName}"</span>? This action cannot be undone.
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

// Publish Toggle Modal
const PublishToggleModal = ({
  isOpen,
  isLive,
  imageName,
  onConfirm,
  onCancel,
  isLoading
}: {
  isOpen: boolean;
  isLive: boolean;
  imageName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl max-w-sm w-full border animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4"
               style={{backgroundColor: isLive ? '#fee2e2' : '#dcfce7'}}>
            {isLive ? (
              <EyeOff className="text-red-600" size={24} />
            ) : (
              <Eye className="text-green-600" size={24} />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">
            {isLive ? 'Unpublish Image' : 'Publish Image'}
          </h3>
          
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isLive ? (
              <>This image will be hidden from guests. Only admins can see it.</>
            ) : (
              <>This image will be visible to all guests. Make sure it's ready to be published.</>
            )}
            <br />
            <span className="block mt-2 font-medium text-foreground">"{imageName}"</span>
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
              className={`flex-1 ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {isLive ? 'Unpublishing...' : 'Publishing...'}
                </>
              ) : (
                <>
                  {isLive ? (
                    <>
                      <EyeOff size={16} className="mr-2" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye size={16} className="mr-2" />
                      Publish
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GalleryManagement = () => {
  const {
    allImages,
    categories,
    loading,
    addImage,
    deleteImage,
    toggleImageLive,
    updateImage,
    fetchAllImagesAdmin,
    fetchCategoriesAdmin,
    setUserRole,
  } = useGalleryStore();

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Rooms');
  const [uploading, setUploading] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Rooms');

  // Loading States
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' }>>([]);

  // Modal States
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; imageId: string | null; imageName: string }>({
    isOpen: false,
    imageId: null,
    imageName: ''
  });

  const [publishModal, setPublishModal] = useState<{ isOpen: boolean; imageId: string | null; imageName: string; isLive: boolean }>({
    isOpen: false,
    imageId: null,
    imageName: '',
    isLive: false
  });

  // Filter State
  const [filterCategory, setFilterCategory] = useState('All');

  // Fixed category options for gallery
  const galleryCategories = [
    'Rooms',
    'Restaurant',
    'Pool',
    'Events',
    'Exterior',
    'Other',
  ];

  // Toast Handler
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- AUTH SYNC LOGIC ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role || 'guest');
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, [setUserRole]);

  // Load images on mount
  useEffect(() => {
    fetchAllImagesAdmin();
    fetchCategoriesAdmin();
  }, [fetchAllImagesAdmin, fetchCategoriesAdmin]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFiles || selectedFiles.length === 0) {
      showToast('Please select at least one image', 'error');
      return;
    }

    if (!uploadTitle.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('images', selectedFiles[i]);
      }

      formData.append('title', uploadTitle);
      formData.append('category', uploadCategory);

      await addImage(formData);

      showToast('Image uploaded successfully in draft mode', 'success');

      // Reset form
      setSelectedFiles(null);
      setUploadTitle('');
      setUploadCategory('Rooms');
      setShowUploadModal(false);

      const fileInput = document.getElementById('imageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to upload image',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePublishClick = (imageId: string) => {
    const image = allImages.find(img => img._id === imageId);
    if (image) {
      setPublishModal({
        isOpen: true,
        imageId,
        imageName: image.title,
        isLive: image.isLive
      });
    }
  };

  const handlePublishConfirm = async () => {
    if (!publishModal.imageId) return;

    try {
      setToggleLoading(publishModal.imageId);
      await toggleImageLive(publishModal.imageId);
      showToast(
        `Image ${publishModal.isLive ? 'unpublished' : 'published'} successfully`,
        'success'
      );
      setPublishModal({ isOpen: false, imageId: null, imageName: '', isLive: false });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to toggle image status',
        'error'
      );
    } finally {
      setToggleLoading(null);
    }
  };

  const handleDeleteClick = (imageId: string) => {
    const image = allImages.find(img => img._id === imageId);
    if (image) {
      setDeleteModal({
        isOpen: true,
        imageId,
        imageName: image.title
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.imageId) return;

    try {
      setDeleteLoading(deleteModal.imageId);
      await deleteImage(deleteModal.imageId);
      showToast('Image deleted successfully', 'success');
      setDeleteModal({ isOpen: false, imageId: null, imageName: '' });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to delete image',
        'error'
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditStart = (image: any) => {
    setEditingId(image._id);
    setEditTitle(image.title);
    setEditCategory(image.category);
  };

  const handleSaveEdit = async (imageId: string) => {
    try {
      await updateImage(imageId, {
        title: editTitle,
        category: editCategory,
      });
      showToast('Image updated successfully', 'success');
      setEditingId(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to update image',
        'error'
      );
    }
  };

  const filteredImages = filterCategory === 'All' 
    ? allImages 
    : allImages.filter((img) => img.category === filterCategory);

  return (
    <div className="space-y-6 p-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Image"
        imageName={deleteModal.imageName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, imageId: null, imageName: '' })}
        isLoading={deleteLoading === deleteModal.imageId}
      />

      {/* Publish Toggle Modal */}
      <PublishToggleModal
        isOpen={publishModal.isOpen}
        isLive={publishModal.isLive}
        imageName={publishModal.imageName}
        onConfirm={handlePublishConfirm}
        onCancel={() => setPublishModal({ isOpen: false, imageId: null, imageName: '', isLive: false })}
        isLoading={toggleLoading === publishModal.imageId}
      />

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery Management</h1>
          <p className="text-muted-foreground">Manage and publish hotel images</p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus size={20} className="mr-2" />
          Add Images
        </Button>
      </div>

      {/* Gallery Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{allImages.length}</div>
              <p className="text-muted-foreground mt-2">Total Images</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {allImages.filter((img) => img.isLive).length}
              </div>
              <p className="text-green-700 mt-2">Live Images</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-700">
                {allImages.filter((img) => !img.isLive).length}
              </div>
              <p className="text-muted-foreground mt-2">Draft Images</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">Filter by Category</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...categories.filter((cat) => cat !== 'All')].map((category) => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                filterCategory === category
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Images Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage, publish and delete images
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin mb-4 text-primary" size={32} />
              <p className="text-muted-foreground">Loading images...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
              <Upload className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-muted-foreground font-medium">No images found</p>
              <p className="text-sm text-gray-500 mt-1">
                Click "Add Images" to upload your first image.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredImages.map((image) => (
                <div
                  key={image._id}
                  className="relative group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow border bg-card"
                >
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <div
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
                        image.isLive ? 'bg-green-500' : 'bg-slate-500'
                      }`}
                    >
                      {image.isLive ? 'Live' : 'Draft'}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={`${(import.meta as any).env?.VITE_BACKEND_IMAGE_URL}${image.images[0]}` || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/400x300?text=Error+Loading';
                      }}
                    />
                  </div>

                  {/* Content Overlay / Action Area */}
                  <div className="p-4">
                    {editingId === image._id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2 py-1 border text-black rounded text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="Title"
                        />
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full px-2 py-1 border text-black rounded text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          {galleryCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(image._id)}
                            className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingId(null)}
                            className="flex-1 h-8 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <h3 className="font-semibold text-sm truncate" title={image.title}>{image.title}</h3>
                          <p className="text-xs text-muted-foreground">{image.category}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2 opacity-100 transition-opacity">
                          {/* Toggle Live */}
                          <Button
                            size="sm"
                            variant={image.isLive ? "default" : "outline"}
                            onClick={() => handlePublishClick(image._id)}
                            disabled={toggleLoading === image._id}
                            className={`h-8 px-0 ${image.isLive ? 'bg-slate-900 hover:bg-slate-800' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                            title={image.isLive ? "Unpublish" : "Publish"}
                          >
                            {toggleLoading === image._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : image.isLive ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </Button>

                          {/* Edit */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStart(image)}
                            className="h-8 px-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </Button>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(image._id)}
                            disabled={deleteLoading === image._id}
                            className="h-8 px-0 text-red-600 border-red-200 hover:bg-red-50"
                            title="Delete"
                          >
                            {deleteLoading === image._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur z-10">
              <h2 className="text-xl font-bold">Upload Images</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles(null);
                  setUploadTitle('');
                  setUploadCategory('Rooms');
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form onSubmit={handleUpload} className="space-y-5">
                {/* Title Input */}
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Image Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g., Deluxe Suite with Ocean View"
                    className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Category Select */}
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {galleryCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Images (up to 2) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="imageInput"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="imageInput"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer bg-accent/5 hover:bg-accent/10 hover:border-primary/50 transition-all"
                    >
                      <Upload className="text-muted-foreground mb-2" size={24} />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF</p>
                    </label>
                  </div>
                  {selectedFiles && (
                    <div className="bg-primary/10 text-primary text-xs px-3 py-2 rounded-md font-medium flex items-center">
                       <CheckCircle size={12} className="mr-2" />
                       {selectedFiles.length} file(s) ready to upload
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManagement;