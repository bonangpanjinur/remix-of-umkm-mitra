import { cn } from '@/lib/utils';
import { MapPin, Utensils, Camera, ShoppingBag } from 'lucide-react';

export type ExploreCategory = 'all' | 'villages' | 'tourism' | 'products';

interface CategoryTabsProps {
  activeCategory: ExploreCategory;
  onCategoryChange: (category: ExploreCategory) => void;
}

const categories = [
  { id: 'all' as const, label: 'Semua', icon: null },
  { id: 'villages' as const, label: 'Desa', icon: MapPin },
  { id: 'tourism' as const, label: 'Wisata', icon: Camera },
  { id: 'products' as const, label: 'Produk', icon: ShoppingBag },
];

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        const Icon = category.icon;
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-brand"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
