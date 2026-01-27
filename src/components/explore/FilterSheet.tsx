import { useState } from 'react';
import { X, SlidersHorizontal, MapPin, Banknote, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface FilterOptions {
  priceRange: [number, number] | null;
  districts: string[];
  minRating: number | null;
}

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  availableDistricts: string[];
}

const priceRanges: { label: string; value: [number, number] }[] = [
  { label: '< Rp 10.000', value: [0, 10000] },
  { label: 'Rp 10.000 - 25.000', value: [10000, 25000] },
  { label: 'Rp 25.000 - 50.000', value: [25000, 50000] },
  { label: 'Rp 50.000 - 100.000', value: [50000, 100000] },
  { label: '> Rp 100.000', value: [100000, 999999999] },
];

const ratingOptions = [4, 3, 2, 1];

export function FilterSheet({ 
  isOpen, 
  onClose, 
  filters, 
  onApplyFilters,
  availableDistricts 
}: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handlePriceSelect = (range: [number, number]) => {
    const isSame = localFilters.priceRange?.[0] === range[0] && localFilters.priceRange?.[1] === range[1];
    setLocalFilters(prev => ({
      ...prev,
      priceRange: isSame ? null : range
    }));
  };

  const handleDistrictToggle = (district: string) => {
    setLocalFilters(prev => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter(d => d !== district)
        : [...prev.districts, district]
    }));
  };

  const handleRatingSelect = (rating: number) => {
    setLocalFilters(prev => ({
      ...prev,
      minRating: prev.minRating === rating ? null : rating
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      priceRange: null,
      districts: [],
      minRating: null
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const activeFilterCount = 
    (localFilters.priceRange ? 1 : 0) + 
    (localFilters.districts.length > 0 ? 1 : 0) + 
    (localFilters.minRating ? 1 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 z-50"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">Filter</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Price Range */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Rentang Harga</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((range) => {
                    const isSelected = localFilters.priceRange?.[0] === range.value[0] && 
                                       localFilters.priceRange?.[1] === range.value[1];
                    return (
                      <button
                        key={range.label}
                        onClick={() => handlePriceSelect(range.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        )}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* District/Location */}
              {availableDistricts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Lokasi / Kecamatan</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableDistricts.map((district) => {
                      const isSelected = localFilters.districts.includes(district);
                      return (
                        <button
                          key={district}
                          onClick={() => handleDistrictToggle(district)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                          )}
                        >
                          {district}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rating */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Rating Minimum</h3>
                </div>
                <div className="flex gap-2">
                  {ratingOptions.map((rating) => {
                    const isSelected = localFilters.minRating === rating;
                    return (
                      <button
                        key={rating}
                        onClick={() => handleRatingSelect(rating)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        )}
                      >
                        <Star className={cn("h-3 w-3", isSelected ? "fill-current" : "")} />
                        {rating}+
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 border-t border-border flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button
                className="flex-1"
                onClick={handleApply}
              >
                Terapkan Filter
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Filter Button Component
interface FilterButtonProps {
  onClick: () => void;
  activeCount: number;
}

export function FilterButton({ onClick, activeCount }: FilterButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all border",
              activeCount > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-foreground text-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium shadow-sm">
                {activeCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Filter
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
