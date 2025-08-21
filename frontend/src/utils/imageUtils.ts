import { env } from '@/config/env';

/**
 * Utility functions for handling product images
 */

/**
 * Converts a relative image path to a full URL
 * @param imagePath - The image path (relative or absolute)
 * @returns Full URL for the image
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // If it's already a full URL (starts with http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path, convert to full URL
  if (imagePath.startsWith('/uploads/')) {
    // Remove /api/v1 from API_BASE_URL to get the base server URL
    const baseUrl = env.API_BASE_URL.replace('/api/v1', '');
    return `${baseUrl}${imagePath}`;
  }
  
  // If it doesn't start with /uploads/, assume it's a relative path and prepend /uploads/products/
  const baseUrl = env.API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}/uploads/products/${imagePath}`;
};

/**
 * Processes an array of image paths and converts them to full URLs
 * @param images - Array of image paths
 * @returns Array of full image URLs
 */
export const processImageUrls = (images: string[]): string[] => {
  if (!images || !Array.isArray(images)) return [];
  
  return images
    .filter(image => image && image.trim() !== '') // Remove empty/null images
    .map(image => getImageUrl(image));
};

/**
 * Gets the first valid image URL from an array of images
 * @param images - Array of image paths
 * @returns First valid image URL or empty string
 */
export const getFirstImageUrl = (images: string[]): string => {
  const processedImages = processImageUrls(images);
  return processedImages.length > 0 ? processedImages[0] : '';
};

/**
 * Checks if an image URL is valid (not empty and properly formatted)
 * @param imageUrl - The image URL to validate
 * @returns True if the URL is valid
 */
export const isValidImageUrl = (imageUrl: string): boolean => {
  if (!imageUrl || imageUrl.trim() === '') return false;
  
  // Check if it's a properly formatted URL
  try {
    new URL(imageUrl);
    return true;
  } catch {
    // If URL constructor fails, check if it's a valid relative path
    return imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/assets/');
  }
};

/**
 * Gets a fallback image URL for products without images
 * @returns Default placeholder image URL
 */
export const getFallbackImageUrl = (): string => {
  return '/assets/images/no-image-placeholder.png';
};

/**
 * Determines if a product has valid images
 * @param product - Product object with images array
 * @returns True if product has at least one valid image
 */
export const hasValidImages = (product: { images?: string[] }): boolean => {
  if (!product.images || product.images.length === 0) return false;
  
  return product.images.some(image => 
    image && 
    image.trim() !== '' && 
    !image.includes('unsplash.com') // Exclude Unsplash placeholder images
  );
};