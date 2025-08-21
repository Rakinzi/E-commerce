import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Plus,
  Trash2,
  Eye,
  Edit3,
  Package
} from 'lucide-react';
import { vendorAPI, type Product } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const categories = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Sports & Fitness',
  'Books',
  'Beauty',
  'Toys',
  'Automotive',
  'Health',
  'Other'
];

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    stock: '',
    sku: '',
    isActive: true,
    tags: '',
    brand: '',
    material: '',
    color: '',
    size: ''
  });

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getProduct(id!);
      const productData = response.data.product;
      setProduct(productData);
      
      // Populate form data
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price?.toString() || '',
        category: productData.category || '',
        subcategory: productData.subcategory || '',
        stock: productData.stock?.toString() || '',
        sku: productData.sku || '',
        isActive: productData.isActive !== false,
        tags: productData.tags?.join(', ') || '',
        brand: productData.brand || '',
        material: productData.material || '',
        color: productData.color || '',
        size: productData.size || ''
      });
    } catch (error) {
      console.error('Failed to load product:', error);
      toast.error('Failed to load product');
      navigate('/vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData = new FormData();
      updateData.append('name', formData.name);
      updateData.append('description', formData.description);
      updateData.append('price', formData.price);
      updateData.append('category', formData.category);
      updateData.append('stock', formData.stock);
      updateData.append('sku', formData.sku);
      updateData.append('isActive', formData.isActive.toString());
      updateData.append('weight', formData.weight);
      updateData.append('dimensions', formData.dimensions);
      updateData.append('brand', formData.brand);
      updateData.append('material', formData.material);
      updateData.append('color', formData.color);
      updateData.append('size', formData.size);
      
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        updateData.append('tags', JSON.stringify(tagsArray));
      }

      await vendorAPI.updateProduct(id!, updateData);
      toast.success('Product updated successfully');
      
      // Reload product data
      await loadProduct();
    } catch (error: any) {
      console.error('Failed to update product:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update product';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      await vendorAPI.addProductImages(id!, formData);
      toast.success('Images uploaded successfully');
      await loadProduct();
    } catch (error: any) {
      console.error('Failed to upload images:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload images';
      toast.error(errorMessage);
    }
  };

  const handleImageReorder = (fromIndex: number, toIndex: number) => {
    if (!product?.images) return;
    
    const newImages = [...product.images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    
    setProduct(prev => prev ? { ...prev, images: newImages } : null);
    
    // TODO: Call API to reorder images on backend
    toast.success('Image order updated');
  };

  const handleImageDelete = async (imageIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await vendorAPI.removeProductImage(id!, imageIndex);
      toast.success('Image deleted successfully');
      await loadProduct();
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete image';
      toast.error(errorMessage);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedImageIndex !== null && draggedImageIndex !== dropIndex) {
      handleImageReorder(draggedImageIndex, dropIndex);
    }
    setDraggedImageIndex(null);
  };

  if (!hasRole('vendor') && !hasRole('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Access denied. Vendor permissions required.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/vendor')} className="bg-black text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/vendor')}
                variant="outline"
                size="sm"
                className="rounded-none"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-black text-black tracking-tight">
                  EDIT PRODUCT
                </h1>
                <p className="text-gray-600 font-light">
                  {product.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                {product.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-black text-white hover:bg-gray-800 rounded-none"
              >
                {saving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="details" className="uppercase tracking-wide font-medium">Product Details</TabsTrigger>
            <TabsTrigger value="images" className="uppercase tracking-wide font-medium">Images</TabsTrigger>
            <TabsTrigger value="advanced" className="uppercase tracking-wide font-medium">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Basic Info */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="mt-1"
                      rows={4}
                      placeholder="Enter product description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className="mt-1"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', e.target.value)}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        className="mt-1"
                        placeholder="Product SKU"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      className="mt-1"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Product is active</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Product Specifications */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Product Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        className="mt-1"
                        placeholder="Brand name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="material">Material</Label>
                      <Input
                        id="material"
                        value={formData.material}
                        onChange={(e) => handleInputChange('material', e.target.value)}
                        className="mt-1"
                        placeholder="Material type"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        className="mt-1"
                        placeholder="Color"
                      />
                    </div>
                    <div>
                      <Label htmlFor="size">Size</Label>
                      <Input
                        id="size"
                        value={formData.size}
                        onChange={(e) => handleInputChange('size', e.target.value)}
                        className="mt-1"
                        placeholder="Size"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        className="mt-1"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        value={formData.dimensions}
                        onChange={(e) => handleInputChange('dimensions', e.target.value)}
                        className="mt-1"
                        placeholder="L x W x H"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="images" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Product Images
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Drag and drop to reorder images. The first image will be used as the main product image.
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drop your images here, or{' '}
                      <label className="text-black font-medium cursor-pointer hover:underline">
                        browse files
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, WebP images are supported
                    </p>
                  </div>

                  {/* Images Grid */}
                  {product.images && product.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {product.images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative group border rounded-lg overflow-hidden bg-gray-50 cursor-move"
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          <div className="aspect-square">
                            <img
                              src={imageUrl}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {index === 0 && (
                            <Badge className="absolute top-2 left-2 bg-black text-white">
                              Main
                            </Badge>
                          )}
                          
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(imageUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0"
                              onClick={() => handleImageDelete(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
                      <p className="text-gray-500">Upload some images to showcase your product</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="advanced" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <p className="text-sm text-gray-600">
                    Additional product information and metadata
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Product Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product ID:</span>
                          <span className="font-mono text-xs">{product._id}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">SEO Information</h4>
                      <p className="text-sm text-gray-600">
                        Search engine optimization settings will be available in future updates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}