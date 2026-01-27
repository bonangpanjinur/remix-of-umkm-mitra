import { Search } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ 
  title = "Tidak ada hasil", 
  description = "Coba kata kunci lain atau filter yang berbeda" 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-bold text-foreground text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm text-center max-w-[250px]">
        {description}
      </p>
    </div>
  );
}
