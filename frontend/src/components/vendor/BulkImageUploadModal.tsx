import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, Image, CheckCircle, AlertCircle, FileImage } from 'lucide-react';
import { vendorAPI, type Product } from '@/lib/api';

interface BulkImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  products: Product[];
  preSelectedProduct?: Product; // Optional: pre-select a specific product for single product image upload
}

interface ImageFile {
  file: File;
  preview: string;
  productId?: string;
  productSku?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadResult {
  success: boolean;
  uploaded: number;
  failed: number;
  errors: Array<{
    filename: string;
    error: string;
  }>;
}

export default function BulkImageUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  products,
  preSelectedProduct
}: BulkImageUploadModalProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [matchingMode, setMatchingMode] = useState<'sku' | 'manual'>('sku');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const newImages: ImageFile[] = imageFiles.map(file => {
      const preview = URL.createObjectURL(file);
      
      // Try to match by SKU from filename or use pre-selected product
      let productId = '';
      let productSku = '';
      
      if (preSelectedProduct) {
        // If a product is pre-selected, use it for all images
        productId = preSelectedProduct._id;
        productSku = preSelectedProduct.sku;
      } else if (matchingMode === 'sku') {
        const filename = file.name.toLowerCase();
        const matchedProduct = products.find(product => {
          const sku = product.sku?.toLowerCase();
          return sku && filename.includes(sku);
        });
        
        if (matchedProduct) {
          productId = matchedProduct._id;
          productSku = matchedProduct.sku;
        }
      }
      
      return {
        file,
        preview,
        productId,
        productSku,
        status: 'pending' as const
      };
    });

    setImages(prev => [...prev, ...newImages]);
  };

  const updateImageProductMapping = (imageIndex: number, productId: string) => {
    setImages(prev => prev.map((image, index) => {
      if (index === imageIndex) {
        const product = products.find(p => p._id === productId);
        return {
          ...image,
          productId,
          productSku: product?.sku || ''
        };
      }
      return image;
    }));
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleUpload = async () => {
    if (images.length === 0) return;

    // Check if all images have product mappings
    const unmappedImages = images.filter(img => !img.productId);
    if (unmappedImages.length > 0) {
      alert(`Please assign products to all images. ${unmappedImages.length} image(s) are not mapped to any product.`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const totalImages = images.length;
      let uploaded = 0;
      let failed = 0;
      const errors: Array<{ filename: string; error: string }> = [];

      // Update images status to uploading
      setImages(prev => prev.map(img => ({ ...img, status: 'uploading' as const })));

      // Upload images one by one
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        try {
          const formData = new FormData();
          formData.append('image', image.file);
          formData.append('productId', image.productId!);

          await vendorAPI.uploadProductImage(formData);
          
          // Update image status to success
          setImages(prev => prev.map((img, index) => 
            index === i ? { ...img, status: 'success' as const } : img
          ));
          
          uploaded++;
        } catch (error: any) {
          // Update image status to error
          const errorMessage = error.response?.data?.error || 'Upload failed';
          setImages(prev => prev.map((img, index) => 
            index === i ? { ...img, status: 'error' as const, error: errorMessage } : img
          ));
          
          failed++;
          errors.push({
            filename: image.file.name,
            error: errorMessage
          });
        }

        // Update progress
        setUploadProgress(((i + 1) / totalImages) * 100);
      }

      // Set final result
      setUploadResult({
        success: uploaded > 0,
        uploaded,
        failed,
        errors
      });

      // Don't call onUploadComplete here - let user finish assignment first

    } catch (error) {
      console.error('Bulk upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up object URLs
    images.forEach(image => URL.revokeObjectURL(image.preview));
    setImages([]);
    setUploadResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

  const handleComplete = () => {
    handleClose();
    onUploadComplete();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl bg-white rounded-none shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white sticky top-0 z-10">
            <h2 className="text-2xl font-black text-black tracking-tight">
              {preSelectedProduct ? `ADD IMAGES TO ${preSelectedProduct.name?.toUpperCase()}` : 'BULK IMAGE UPLOAD'}
            </h2>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="rounded-none"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!uploadResult && !isUploading && (
              <>
                {/* Instructions */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3">How to Upload Images:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    {preSelectedProduct ? (
                      <>
                        <li>Upload images for <strong>{preSelectedProduct.name}</strong> using the area below</li>
                        <li>All images will be automatically assigned to this product</li>
                        <li>Review and upload all images</li>
                      </>
                    ) : (
                      <>
                        <li>Choose your image matching mode (SKU-based or manual)</li>
                        <li>Upload your product images using the area below</li>
                        <li>Assign each image to the correct product</li>
                        <li>Review the assignments and upload all images</li>
                      </>
                    )}
                  </ol>
                </div>

                {/* Matching Mode */}
                {!preSelectedProduct && (
                  <div className="mb-6">
                    <label className="block font-medium mb-2">Image Matching Mode:</label>
                    <Select value={matchingMode} onValueChange={(value: 'sku' | 'manual') => setMatchingMode(value)}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sku">Auto-match by SKU in filename</SelectItem>
                        <SelectItem value="manual">Manual assignment</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      {matchingMode === 'sku' 
                        ? 'Images will be automatically matched to products if the filename contains the product SKU'
                        : 'You will manually assign each image to a product'
                      }
                    </p>
                  </div>
                )}

                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-none p-8 text-center transition-colors mb-6 ${
                    dragActive ? 'border-black bg-gray-50' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {preSelectedProduct ? (
                      <>
                        Drop images for <strong>{preSelectedProduct.name}</strong> here, or{' '}
                        <label className="text-black font-medium cursor-pointer hover:underline">
                          browse files
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        Drag and drop your product images here, or{' '}
                        <label className="text-black font-medium cursor-pointer hover:underline">
                          browse files
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, WebP images are accepted. You can upload multiple images at once.
                    {preSelectedProduct && <br />}
                    {preSelectedProduct && 'All images will be added to the selected product.'}
                  </p>
                </div>

                {/* Images Grid */}
                {images.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-lg mb-4">Uploaded Images ({images.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {images.map((image, index) => (
                        <div key={index} className="border rounded p-4">
                          <div className="aspect-square mb-3 bg-gray-100 rounded overflow-hidden">
                            <img
                              src={image.preview}
                              alt={image.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium truncate" title={image.file.name}>
                              {image.file.name}
                            </p>
                            
                            {preSelectedProduct ? (
                              <div className="w-full p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                                <strong>✓ {preSelectedProduct.sku ? `${preSelectedProduct.sku} - ` : ''}{preSelectedProduct.name}</strong>
                              </div>
                            ) : (
                              <Select 
                                value={image.productId || ''} 
                                onValueChange={(value) => updateImageProductMapping(index, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select product..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map(product => (
                                    <SelectItem key={product._id} value={product._id}>
                                      {product.sku ? `${product.sku} - ` : ''}{product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {image.productSku && (
                              <p className="text-xs text-green-600">
                                ✓ Matched to SKU: {image.productSku}
                              </p>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <span className={`text-xs px-2 py-1 rounded ${
                                image.status === 'success' ? 'bg-green-100 text-green-800' :
                                image.status === 'error' ? 'bg-red-100 text-red-800' :
                                image.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {image.status === 'pending' ? 'Ready' :
                                 image.status === 'uploading' ? 'Uploading...' :
                                 image.status === 'success' ? 'Uploaded' :
                                 'Failed'}
                              </span>
                              
                              <Button
                                onClick={() => removeImage(index)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {image.error && (
                              <p className="text-xs text-red-600">{image.error}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1 rounded-none border-gray-300"
                  >
                    CANCEL
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={images.length === 0 || images.some(img => !img.productId)}
                    className="flex-1 bg-black text-white hover:bg-gray-800 rounded-none"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    UPLOAD ALL IMAGES
                  </Button>
                </div>
              </>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="font-bold text-lg mb-2">Uploading Images...</h3>
                  <p className="text-gray-600">Please wait while we upload your images</p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <Progress value={uploadProgress} className="mb-2" />
                  <p className="text-sm text-gray-500">{Math.round(uploadProgress)}% complete</p>
                </div>
              </div>
            )}

            {/* Upload Results */}
            {uploadResult && (
              <div className="py-4">
                <div className="flex items-center justify-center mb-6">
                  {uploadResult.success ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : (
                    <AlertCircle className="h-16 w-16 text-red-500" />
                  )}
                </div>

                <div className="text-center mb-6">
                  <h3 className="font-bold text-xl mb-2">
                    {uploadResult.success ? 'Upload Completed!' : 'Upload Issues Found'}
                  </h3>
                  
                  <div className="space-y-2">
                    {uploadResult.uploaded > 0 && (
                      <p className="text-green-600 font-medium">
                        ✓ {uploadResult.uploaded} images uploaded successfully
                      </p>
                    )}
                    
                    {uploadResult.failed > 0 && (
                      <p className="text-red-600 font-medium">
                        ✗ {uploadResult.failed} images failed to upload
                      </p>
                    )}
                  </div>
                </div>

                {/* Error Details */}
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-lg mb-3 text-red-600">Errors:</h4>
                    <div className="max-h-60 overflow-y-auto bg-red-50 border border-red-200 rounded p-4">
                      {uploadResult.errors.map((error, index) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <p className="font-medium text-red-800">{error.filename}:</p>
                          <p className="text-red-700 text-sm ml-4">{error.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <Button
                  onClick={handleComplete}
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-none"
                >
                  DONE
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}