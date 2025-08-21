import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { vendorAPI, type Product } from '@/lib/api';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  tags: z.string().optional(),
  active: z.boolean().optional()
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
  product?: Product | null;
}

export default function ProductUploadModal({
  isOpen,
  onClose,
  onProductCreated,
  product
}: ProductUploadModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const isEditing = !!product;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: isEditing ? {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      category: product?.category || '',
      subcategory: product?.subcategory || '',
      stock: product?.stock || 0,
      sku: product?.sku || '',
      tags: product?.tags?.join(', ') || '',
      active: product?.active !== false
    } : {
      name: '',
      description: '',
      price: 0,
      category: '',
      subcategory: '',
      stock: 0,
      sku: '',
      tags: '',
      active: true
    }
  });

  // Reset form when product changes
  useEffect(() => {
    if (isEditing && product) {
      const formData = {
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        category: product.category || '',
        subcategory: product.subcategory || '',
        stock: product.stock || 0,
        sku: product.sku || '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        active: product.active !== false && product.isActive !== false
      };
      console.log('Resetting form with data:', formData);
      form.reset(formData);
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        category: '',
        subcategory: '',
        stock: 0,
        sku: '',
        tags: '',
        active: true
      });
    }
  }, [product, isEditing, form]);

  const categories = [
    'Paint & Decoration',
    'Building Materials', 
    'Tools & Equipment',
    'Electronics',
    'Clothing',
    'Home & Garden'
  ];

  const subcategoriesByCategory: Record<string, string[]> = {
    'Paint & Decoration': [
      'Interior Paint',
      'Exterior Paint', 
      'Paint Accessories',
      'Ceiling Paints',
      'Gloss Paints',
      'Primers & Undercoats'
    ],
    'Building Materials': [
      'Cement',
      'Reinforcements',
      'Doors',
      'Roofing & Ceiling',
      'Timber',
      'Insulation'
    ],
    'Tools & Equipment': [
      'Power Tools',
      'Hand Tools',
      'Measuring Tools',
      'Safety Equipment',
      'Garden Tools',
      'Tool Storage'
    ],
    'Electronics': [
      'Audio Devices',
      'Computer Hardware',
      'Mobile Accessories',
      'Gaming',
      'Smart Home'
    ],
    'Clothing': [
      'Men\'s Clothing',
      'Women\'s Clothing',
      'Children\'s Clothing',
      'Accessories',
      'Footwear'
    ],
    'Home & Garden': [
      'Furniture',
      'Kitchenware',
      'Garden Tools',
      'Outdoor Living',
      'Storage Solutions'
    ]
  };

  const selectedCategory = form.watch('category');
  const availableSubcategories = selectedCategory ? subcategoriesByCategory[selectedCategory] || [] : [];

  const handleImageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== fileArray.length) {
      alert('Some files were skipped. Only images under 5MB are allowed.');
    }

    const newFiles = [...imageFiles, ...validFiles].slice(0, 5);
    setImageFiles(newFiles);

    // Generate previews
    const newPreviews = [...imagePreviews];
    validFiles.forEach(file => {
      if (newPreviews.length < 5) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImagePreviews(prev => [...prev, e.target!.result as string].slice(0, 5));
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

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
      handleImageFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);

      console.log('Form data being submitted:', data);
      console.log('Image files:', imageFiles);

      const formData = new FormData();
      
      // Add form fields
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('category', data.category);
      formData.append('subcategory', data.subcategory);
      formData.append('stock', data.stock.toString());
      formData.append('sku', data.sku);
      
      if (data.tags) {
        const tags = data.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        tags.forEach(tag => formData.append('tags[]', tag));
      }

      formData.append('active', (data.active !== false).toString());

      // Add image files
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      // Log FormData contents for debugging
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      if (isEditing) {
        await vendorAPI.updateProduct(product!._id, formData);
      } else {
        await vendorAPI.createProduct(formData);
      }

      onProductCreated();
      handleClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      
      // Better error handling
      if (error instanceof Error) {
        if ('response' in error && (error as any).response?.data?.details) {
          console.error('Validation errors:', (error as any).response.data.details);
          alert('Validation failed: ' + (error as any).response.data.details.map((e: any) => e.message).join(', '));
        } else {
          alert('Failed to save product: ' + error.message);
        }
      } else {
        alert('Failed to save product. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setImageFiles([]);
    setImagePreviews([]);
    onClose();
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
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-none shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-black text-black tracking-tight">
              {isEditing ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
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
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-bold text-black uppercase tracking-wide">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    className="mt-2 rounded-none border-gray-300 focus:border-black"
                    placeholder="Enter product name"
                    disabled={isLoading}
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sku" className="text-sm font-bold text-black uppercase tracking-wide">
                    SKU *
                  </Label>
                  <Input
                    id="sku"
                    {...form.register('sku')}
                    className="mt-2 rounded-none border-gray-300 focus:border-black"
                    placeholder="Enter SKU"
                    disabled={isLoading}
                  />
                  {form.formState.errors.sku && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.sku.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-bold text-black uppercase tracking-wide">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  className="mt-2 rounded-none border-gray-300 focus:border-black min-h-[120px]"
                  placeholder="Enter product description"
                  disabled={isLoading}
                />
                {form.formState.errors.description && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>

              {/* Category and Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category" className="text-sm font-bold text-black uppercase tracking-wide">
                    Category *
                  </Label>
                  <Select 
                    onValueChange={(value) => {
                      form.setValue('category', value);
                      form.setValue('subcategory', ''); // Reset subcategory when category changes
                    }} 
                    value={form.watch('category')} 
                    disabled={isLoading}
                  >
                    <SelectTrigger className="mt-2 rounded-none border-gray-300 focus:border-black">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subcategory" className="text-sm font-bold text-black uppercase tracking-wide">
                    Subcategory *
                  </Label>
                  <Select 
                    onValueChange={(value) => form.setValue('subcategory', value)} 
                    value={form.watch('subcategory')} 
                    disabled={isLoading || !selectedCategory}
                  >
                    <SelectTrigger className="mt-2 rounded-none border-gray-300 focus:border-black">
                      <SelectValue placeholder={selectedCategory ? "Select subcategory" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map(subcat => (
                        <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.subcategory && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.subcategory.message}</p>
                  )}
                </div>
              </div>

              {/* Pricing and Inventory */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="price" className="text-sm font-bold text-black uppercase tracking-wide">
                    Price *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('price', { valueAsNumber: true })}
                    className="mt-2 rounded-none border-gray-300 focus:border-black"
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  {form.formState.errors.price && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.price.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="stock" className="text-sm font-bold text-black uppercase tracking-wide">
                    Stock *
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    {...form.register('stock', { valueAsNumber: true })}
                    className="mt-2 rounded-none border-gray-300 focus:border-black"
                    placeholder="0"
                    disabled={isLoading}
                  />
                  {form.formState.errors.stock && (
                    <p className="text-red-600 text-sm mt-1">{form.formState.errors.stock.message}</p>
                  )}
                </div>

              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="tags" className="text-sm font-bold text-black uppercase tracking-wide">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    {...form.register('tags')}
                    className="mt-2 rounded-none border-gray-300 focus:border-black"
                    placeholder="tag1, tag2, tag3"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                </div>
              </div>

              {/* Images Upload */}
              <div>
                <Label className="text-sm font-bold text-black uppercase tracking-wide">
                  Product Images
                </Label>
                
                <div
                  className={`mt-2 border-2 border-dashed rounded-none p-8 text-center transition-colors ${
                    dragActive ? 'border-black bg-gray-50' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop images here, or{' '}
                    <label className="text-black font-medium cursor-pointer hover:underline">
                      browse files
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
                        disabled={isLoading}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum 5 images, up to 5MB each
                  </p>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover border border-gray-200"
                        />
                        <Button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 rounded-none border-gray-300"
                  disabled={isLoading}
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-black text-white hover:bg-gray-800 rounded-none"
                  disabled={isLoading}
                >
                  {isLoading ? 'SAVING...' : (isEditing ? 'UPDATE PRODUCT' : 'CREATE PRODUCT')}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}