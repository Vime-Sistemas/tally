import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

// ============================================================================
// Haptic Feedback
// ============================================================================

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    navigator.vibrate(patterns[type]);
  }
};

// ============================================================================
// Component
// ============================================================================

export function PullToRefresh({ onRefresh, children, className, disabled = false }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  
  // Transform values
  const indicatorOpacity = useTransform(y, [0, PULL_THRESHOLD / 2, PULL_THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, PULL_THRESHOLD], [0.5, 1]);
  const rotation = useTransform(y, [0, PULL_THRESHOLD], [0, 180]);

  // Check if we're at the top of the scroll
  const isAtTop = useCallback(() => {
    if (!containerRef.current) return true;
    return containerRef.current.scrollTop <= 0;
  }, []);

  // Handle drag
  const handleDrag = useCallback((_: any, info: PanInfo) => {
    if (disabled || isRefreshing || !isAtTop()) return;
    
    const newY = Math.max(0, Math.min(MAX_PULL, info.offset.y));
    y.set(newY);
    
    if (!isPulling && newY > 10) {
      setIsPulling(true);
    }
    
    // Trigger haptic when threshold is crossed
    if (newY >= PULL_THRESHOLD && !hasTriggeredHaptic) {
      triggerHaptic('medium');
      setHasTriggeredHaptic(true);
    } else if (newY < PULL_THRESHOLD && hasTriggeredHaptic) {
      setHasTriggeredHaptic(false);
    }
  }, [disabled, isRefreshing, isAtTop, isPulling, hasTriggeredHaptic, y]);

  // Handle drag end
  const handleDragEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    const currentY = y.get();
    
    if (currentY >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      triggerHaptic('heavy');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    y.set(0);
    setIsPulling(false);
    setHasTriggeredHaptic(false);
  }, [disabled, isRefreshing, onRefresh, y]);

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
      {/* Pull Indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: isRefreshing ? 1 : indicatorOpacity }}
            className="absolute top-0 left-0 right-0 z-20 flex justify-center pointer-events-none"
          >
            <motion.div
              style={{ 
                y: useTransform(y, [0, MAX_PULL], [0, 60]),
                scale: isRefreshing ? 1 : indicatorScale 
              }}
              className="p-3"
            >
              {isRefreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-6 h-6 text-blue-500" />
                </motion.div>
              ) : (
                <motion.div
                  style={{ rotate: rotation }}
                  className={cn(
                    "w-6 h-6 rounded-full border-2",
                    y.get() >= PULL_THRESHOLD 
                      ? "border-blue-500" 
                      : "border-zinc-300"
                  )}
                >
                  <svg viewBox="0 0 24 24" className="w-full h-full p-1">
                    <path 
                      d="M12 4v12m0 0l-4-4m4 4l4-4" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className={y.get() >= PULL_THRESHOLD ? "text-blue-500" : "text-zinc-400"}
                    />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        drag={!disabled && !isRefreshing ? "y" : false}
        dragConstraints={{ top: 0, bottom: MAX_PULL }}
        dragElastic={0.5}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: isRefreshing ? 60 : y }}
        animate={!isPulling && !isRefreshing ? { y: 0 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
