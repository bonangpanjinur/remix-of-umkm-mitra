import { Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex bg-secondary rounded-xl p-0.5">
      <button
        onClick={() => onChange('grid')}
        className={cn(
          "p-2 rounded-lg transition-all",
          value === 'grid'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Grid view"
      >
        <Grid3X3 className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={cn(
          "p-2 rounded-lg transition-all",
          value === 'list'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
