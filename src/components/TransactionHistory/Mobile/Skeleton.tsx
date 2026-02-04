import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================================
// Transaction Item Skeleton
// ============================================================================

export function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl">
      {/* Icon Skeleton */}
      <div className="h-10 w-10 rounded-full bg-zinc-100 animate-pulse shrink-0" />
      
      {/* Content Skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-zinc-100 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-zinc-100 rounded animate-pulse" />
      </div>
      
      {/* Amount Skeleton */}
      <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse shrink-0" />
    </div>
  );
}

// ============================================================================
// Date Group Skeleton
// ============================================================================

export function DateGroupSkeleton() {
  return (
    <div className="space-y-3">
      {/* Date Header Skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 bg-zinc-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
      </div>
      
      {/* Transaction Items */}
      <TransactionSkeleton />
      <TransactionSkeleton />
      <TransactionSkeleton />
    </div>
  );
}

// ============================================================================
// Full List Skeleton
// ============================================================================

interface TransactionListSkeletonProps {
  count?: number;
}

export function TransactionListSkeleton({ count = 3 }: TransactionListSkeletonProps) {
  return (
    <div className="space-y-8 mt-6 px-2">
      {Array.from({ length: count }).map((_, i) => (
        <DateGroupSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================================
// Shimmer Effect Skeleton (Premium Feel)
// ============================================================================

export function TransactionShimmerSkeleton() {
  return (
    <div className="relative overflow-hidden flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl">
      {/* Shimmer Overlay */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ translateX: ['100%', '-100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Icon */}
      <div className="h-10 w-10 rounded-full bg-zinc-100 shrink-0" />
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-zinc-100 rounded" />
        <div className="h-3 w-1/2 bg-zinc-100 rounded" />
      </div>
      
      {/* Amount */}
      <div className="h-4 w-20 bg-zinc-100 rounded shrink-0" />
    </div>
  );
}

// ============================================================================
// Pull to Refresh Indicator
// ============================================================================

interface PullIndicatorProps {
  progress: number; // 0 to 1
  isRefreshing: boolean;
}

export function PullToRefreshIndicator({ progress, isRefreshing }: PullIndicatorProps) {
  const rotation = progress * 360;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: progress > 0.1 ? 1 : 0, 
        y: 0,
        scale: isRefreshing ? 1 : Math.min(1, progress)
      }}
      className="flex justify-center py-4"
    >
      <motion.div
        animate={isRefreshing ? { rotate: 360 } : { rotate: rotation }}
        transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
        className={cn(
          "w-8 h-8 rounded-full border-2 border-t-transparent",
          isRefreshing ? "border-blue-500" : "border-zinc-300"
        )}
      />
    </motion.div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        className="bg-zinc-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        {icon}
      </motion.div>
      <h3 className="font-semibold text-zinc-900 text-lg">{title}</h3>
      <p className="text-zinc-500 text-sm mt-1 max-w-xs mx-auto">{description}</p>
      {action && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="mt-4 px-6 py-2.5 bg-blue-500 text-white rounded-full font-medium text-sm"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// ============================================================================
// Loading More Indicator
// ============================================================================

export function LoadingMoreIndicator() {
  return (
    <div className="flex justify-center py-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent"
      />
    </div>
  );
}
