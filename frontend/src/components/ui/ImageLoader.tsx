import { useState } from 'react';
import { Package } from 'lucide-react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export default function ImageLoader({
  src,
  alt,
  className = '',
  fallbackIcon = <Package className="h-12 w-12 text-gray-400" />,
  fallbackText = 'No Image',
  aspectRatio = 'auto'
}: ImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      default:
        return '';
    }
  };

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${getAspectRatioClass()} ${className}`}>
        <div className="text-center">
          {fallbackIcon}
          <p className="text-sm text-gray-500 mt-2">{fallbackText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${getAspectRatioClass()} ${className}`}>
      {/* Shimmer loading effect */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 overflow-hidden">
          <div className="animate-shimmer h-full w-full bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200 bg-[length:200%_100%]" />
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
}

// Shimmer component for product cards
export function ProductImageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 overflow-hidden ${className}`}>
      <div className="animate-shimmer h-full w-full bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200 bg-[length:200%_100%]" />
    </div>
  );
}

// Thumbnail shimmer for product detail
export function ThumbnailSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 overflow-hidden rounded-lg border-2 border-gray-200 ${className}`}>
      <div className="animate-shimmer h-full w-full bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200 bg-[length:200%_100%] rounded-lg" />
    </div>
  );
}