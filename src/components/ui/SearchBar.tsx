import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
}

export function SearchBar({ 
  placeholder = 'Cari produk, desa, atau UMKM...', 
  value = '',
  onChange,
  onSubmit
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="relative group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition placeholder:text-muted-foreground"
      />
    </div>
  );
}
