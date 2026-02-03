import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[]; // Support multiple search keys
  filters?: FilterOption[];
  pageSize?: number;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  onExport?: (data: T[]) => void; // Optional export function
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Cari...',
  searchKeys,
  filters = [],
  pageSize = 10,
  loading = false,
  onRowClick,
  emptyMessage = 'Tidak ada data',
  className,
  onExport,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search across multiple keys
    if (search && searchKeys && searchKeys.length > 0) {
      const query = search.toLowerCase();
      result = result.filter(item => {
        return searchKeys.some(key => {
          const value = item[key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === 'number') {
            return value.toString().includes(query);
          }
          return false;
        });
      });
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(item => {
          const itemValue = (item as Record<string, unknown>)[key];
          return itemValue === value;
        });
      }
    });

    return result;
  }, [data, search, searchKeys, activeFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearch('');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || Object.values(activeFilters).some(v => v && v !== 'all');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
        {searchKeys && searchKeys.length > 0 && (
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || 'all'}
              onValueChange={(value) => handleFilterChange(filter.key, value)}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-3.5 w-3.5 mr-2 opacity-70" />
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua {filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2">
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}

          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(filteredData)} className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Ekspor
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                      <span className="text-sm text-muted-foreground font-medium">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Search className="h-8 w-8 opacity-20" />
                      <p className="text-sm">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      'hover:bg-secondary/20 transition-colors group',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5 text-sm">
                        {col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground font-medium">
            Menampilkan <span className="text-foreground">{startIndex + 1}</span>-
            <span className="text-foreground">{Math.min(startIndex + pageSize, filteredData.length)}</span> dari{' '}
            <span className="text-foreground">{filteredData.length}</span> data
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-xs font-bold">{currentPage}</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
