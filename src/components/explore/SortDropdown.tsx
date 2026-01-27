import { useState } from 'react';
import { ChevronDown, ArrowUpDown, TrendingUp, Clock, DollarSign, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type SortOption = 'relevance' | 'newest' | 'price_low' | 'price_high' | 'rating';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'relevance', label: 'Relevansi', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: 'newest', label: 'Terbaru', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'price_low', label: 'Harga Terendah', icon: <DollarSign className="h-3.5 w-3.5" /> },
  { value: 'price_high', label: 'Harga Tertinggi', icon: <DollarSign className="h-3.5 w-3.5" /> },
  { value: 'rating', label: 'Rating Tertinggi', icon: <Star className="h-3.5 w-3.5" /> },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = sortOptions.find(o => o.value === value) || sortOptions[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-background border border-border hover:border-primary/50 transition-all"
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground">{selectedOption.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden"
            >
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium transition-colors",
                    option.value === value
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
