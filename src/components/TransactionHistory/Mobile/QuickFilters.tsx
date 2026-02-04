import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Calendar as CalendarIcon,
  ChevronDown 
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Input } from '../../ui/input';
import { TransactionType } from '../../../types/transaction';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { DateRange } from 'react-day-picker';

// ============================================================================
// Types
// ============================================================================

interface QuickFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onOpenFullFilters: () => void;
  activeFiltersCount: number;
}

type QuickDateOption = 'today' | 'week' | 'month' | 'last-month' | 'custom';

// ============================================================================
// Constants
// ============================================================================

const DEBOUNCE_DELAY = 300;

const DATE_OPTIONS: { id: QuickDateOption; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'last-month', label: 'Último mês' },
];

// ============================================================================
// Debounce Hook
// ============================================================================

function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// ============================================================================
// Haptic Feedback
// ============================================================================

const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([10]);
  }
};

// ============================================================================
// Component
// ============================================================================

export function QuickFilters({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeChange,
  dateRange,
  onDateRangeChange,
  onOpenFullFilters,
  activeFiltersCount,
}: QuickFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [activeDate, setActiveDate] = useState<QuickDateOption>('month');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  const debouncedSearch = useDebouncedCallback(onSearchChange, DEBOUNCE_DELAY);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
    inputRef.current?.focus();
    triggerHaptic();
  };

  // Handle quick date selection
  const handleDateSelect = (option: QuickDateOption) => {
    triggerHaptic();
    setActiveDate(option);
    
    const today = new Date();
    let range: DateRange | undefined;

    switch (option) {
      case 'today':
        range = { from: startOfDay(today), to: endOfDay(today) };
        break;
      case 'week':
        range = { from: startOfWeek(today, { weekStartsOn: 0 }), to: endOfWeek(today, { weekStartsOn: 0 }) };
        break;
      case 'month':
        range = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case 'last-month':
        const lastMonth = subMonths(today, 1);
        range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      case 'custom':
        onOpenFullFilters();
        return;
    }

    onDateRangeChange(range);
  };

  // Handle type filter
  const handleTypeChange = (type: string) => {
    triggerHaptic();
    onTypeChange(type);
  };

  // Sync active date with external dateRange changes
  useEffect(() => {
    if (!dateRange?.from) return;
    
    const today = new Date();
    const from = dateRange.from;
    const to = dateRange.to || dateRange.from;
    
    // Check which quick option matches
    if (from.getTime() === startOfDay(today).getTime() && to.getTime() === endOfDay(today).getTime()) {
      setActiveDate('today');
    } else if (from.getTime() === startOfWeek(today, { weekStartsOn: 0 }).getTime()) {
      setActiveDate('week');
    } else if (from.getTime() === startOfMonth(today).getTime()) {
      setActiveDate('month');
    } else {
      const lastMonth = subMonths(today, 1);
      if (from.getTime() === startOfMonth(lastMonth).getTime()) {
        setActiveDate('last-month');
      } else {
        setActiveDate('custom');
      }
    }
  }, [dateRange]);

  return (
    <div className="space-y-3">
      {/* Search with Debounce */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          ref={inputRef}
          placeholder="Buscar transações..."
          value={localSearch}
          onChange={handleSearchChange}
          className="pl-9 pr-9 bg-zinc-50 border-zinc-200 rounded-xl h-11 focus-visible:ring-blue-500"
        />
        <AnimatePresence>
          {localSearch && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-200"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Date Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
        {DATE_OPTIONS.map((option) => (
          <motion.button
            key={option.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDateSelect(option.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeDate === option.id
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            )}
          >
            {option.label}
          </motion.button>
        ))}
        
        {/* More Filters Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOpenFullFilters}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
            activeFiltersCount > 0
              ? "bg-blue-500 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Type Filter (Segmented Control) */}
      <div className="flex bg-zinc-100 p-1 rounded-xl">
        {[
          { id: 'ALL', label: 'Todos' },
          { id: TransactionType.INCOME, label: 'Entradas' },
          { id: TransactionType.EXPENSE, label: 'Saídas' },
        ].map((type) => (
          <motion.button
            key={type.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTypeChange(type.id)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              typeFilter === type.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500"
            )}
          >
            {type.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
