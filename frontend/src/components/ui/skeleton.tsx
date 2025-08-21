import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'pulse' | 'wave' | 'shimmer';
  children?: React.ReactNode;
}

export function Skeleton({ className, variant = 'shimmer', children, ...props }: SkeletonProps) {
  const variants = {
    pulse: "animate-pulse bg-gray-200",
    wave: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[wave_2s_ease-in-out_infinite]",
    shimmer: "relative bg-gray-200 overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent"
  };

  return (
    <div
      className={cn(
        "rounded-md",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group border-0 shadow-lg rounded-lg overflow-hidden bg-white"
    >
      {/* Image Skeleton */}
      <div className="relative">
        <Skeleton className="w-full h-64" variant="shimmer" />
        
        {/* Floating elements */}
        <div className="absolute top-4 right-4">
          <Skeleton className="w-10 h-10 rounded-full" variant="pulse" />
        </div>
        <div className="absolute top-4 left-4">
          <Skeleton className="w-16 h-6 rounded-full" variant="pulse" />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" variant="shimmer" />
            <Skeleton className="h-4 w-1/2" variant="pulse" />
          </div>
          <Skeleton className="w-12 h-6 rounded-full" variant="pulse" />
        </div>
        
        <Skeleton className="h-4 w-full mb-2" variant="pulse" />
        <Skeleton className="h-4 w-2/3 mb-4" variant="pulse" />
        
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-20 mb-1" variant="shimmer" />
            <Skeleton className="h-3 w-16" variant="pulse" />
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-3 h-3 rounded-full" variant="pulse" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Button Skeleton */}
      <div className="p-6 pt-0">
        <Skeleton className="w-full h-12 rounded-full" variant="shimmer" />
      </div>
    </motion.div>
  );
}

// Category Card Skeleton
export function CategoryCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="border-0 shadow-xl rounded-lg overflow-hidden bg-white"
    >
      {/* Image Skeleton */}
      <div className="relative h-48">
        <Skeleton className="w-full h-full" variant="shimmer" />
        <div className="absolute top-4 right-4">
          <Skeleton className="w-12 h-12 rounded-full" variant="pulse" />
        </div>
        <div className="absolute bottom-4 left-4">
          <Skeleton className="w-20 h-6 rounded-full" variant="pulse" />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="p-6">
        <Skeleton className="h-7 w-3/4 mb-3" variant="shimmer" />
        <Skeleton className="h-4 w-full mb-2" variant="pulse" />
        <Skeleton className="h-4 w-2/3 mb-4" variant="pulse" />
        
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" variant="pulse" />
          <Skeleton className="w-8 h-8 rounded-full" variant="shimmer" />
        </div>
      </div>
    </motion.div>
  );
}

// Simple Line Skeleton
export function LineSkeleton({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return <Skeleton className={`${width} ${height}`} variant="shimmer" />;
}

// Text Block Skeleton
export function TextBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
          variant="pulse"
        />
      ))}
    </div>
  );
}

// Avatar Skeleton
export function AvatarSkeleton({ size = "w-10 h-10" }: { size?: string }) {
  return <Skeleton className={`${size} rounded-full`} variant="pulse" />;
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 w-3/4" variant="pulse" />
        </td>
      ))}
    </tr>
  );
}

// Dashboard Card Skeleton
export function DashboardCardSkeleton() {
  return (
    <div className="border-gray-200 rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" variant="pulse" />
          <Skeleton className="h-8 w-16" variant="shimmer" />
        </div>
        <Skeleton className="w-8 h-8" variant="pulse" />
      </div>
    </div>
  );
}

// Order Card Skeleton
export function OrderCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-gray-200 rounded-lg border bg-white shadow-sm"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" variant="shimmer" />
          <Skeleton className="h-6 w-20 rounded-full" variant="pulse" />
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 text-sm mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" variant="pulse" />
            <Skeleton className="h-4 w-24" variant="pulse" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" variant="pulse" />
            <Skeleton className="h-4 w-20" variant="pulse" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" variant="pulse" />
            <Skeleton className="h-4 w-16" variant="pulse" />
          </div>
        </div>

        {/* Items Section */}
        <div className="border-t pt-4 mb-4">
          <Skeleton className="h-5 w-16 mb-3" variant="pulse" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-4 w-32 mb-1" variant="shimmer" />
                  <Skeleton className="h-3 w-16" variant="pulse" />
                </div>
                <Skeleton className="h-4 w-12" variant="pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Address Section */}
        <div className="border-t pt-4">
          <Skeleton className="h-5 w-28 mb-2" variant="pulse" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" variant="pulse" />
            <Skeleton className="h-3 w-3/4" variant="pulse" />
            <Skeleton className="h-3 w-1/2" variant="pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}