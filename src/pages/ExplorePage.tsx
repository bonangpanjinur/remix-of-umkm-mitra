import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { SearchBar } from '@/components/ui/SearchBar';
import { VillageCardLarge } from '@/components/explore/VillageCardLarge';
import { TourismCardCompact } from '@/components/explore/TourismCardCompact';
import { ProductCardHorizontal } from '@/components/explore/ProductCardHorizontal';
import { SectionHeader } from '@/components/explore/SectionHeader';
import { CategoryTabs, ExploreCategory } from '@/components/explore/CategoryTabs';
import { EmptyState } from '@/components/explore/EmptyState';
import { fetchVillages, fetchTourism, fetchProducts } from '@/lib/api';
import type { Village, Tourism, Product } from '@/types';

export default function ExplorePage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [tourismSpots, setTourismSpots] = useState<Tourism[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ExploreCategory>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [villagesData, tourismData, productsData] = await Promise.all([
          fetchVillages(),
          fetchTourism(),
          fetchProducts(),
        ]);
        setVillages(villagesData);
        setTourismSpots(tourismData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    const filteredVillages = villages.filter(v => 
      v.name.toLowerCase().includes(query) ||
      v.district?.toLowerCase().includes(query) ||
      v.regency?.toLowerCase().includes(query)
    );
    
    const filteredTourism = tourismSpots.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.villageName?.toLowerCase().includes(query)
    );
    
    const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.merchantName?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query)
    );

    return { 
      villages: filteredVillages, 
      tourism: filteredTourism, 
      products: filteredProducts 
    };
  }, [villages, tourismSpots, products, searchQuery]);

  const showVillages = activeCategory === 'all' || activeCategory === 'villages';
  const showTourism = activeCategory === 'all' || activeCategory === 'tourism';
  const showProducts = activeCategory === 'all' || activeCategory === 'products';

  const hasResults = 
    (showVillages && filteredData.villages.length > 0) ||
    (showTourism && filteredData.tourism.length > 0) ||
    (showProducts && filteredData.products.length > 0);

  return (
    <div className="mobile-shell bg-background flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Search & Filter Section - Clean & Compact */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/30">
          <div className="px-4 pt-3 pb-2">
            <SearchBar 
              placeholder="Cari desa, wisata, atau produk..." 
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          
          {/* Category Tabs - Compact */}
          <div className="px-4 pb-2">
            <CategoryTabs 
              activeCategory={activeCategory} 
              onCategoryChange={setActiveCategory} 
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4" />
            <p className="text-muted-foreground text-sm">Memuat data...</p>
          </div>
        ) : !hasResults ? (
          <EmptyState 
            title={searchQuery ? "Tidak ditemukan" : "Belum ada data"}
            description={searchQuery 
              ? `Tidak ada hasil untuk "${searchQuery}"`
              : "Data belum tersedia saat ini"
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeCategory + searchQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 py-4 space-y-6"
            >
              {/* Villages Section */}
              {showVillages && filteredData.villages.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <SectionHeader 
                    title="Desa Wisata"
                    subtitle={`${filteredData.villages.length} desa tersedia`}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                  <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-5 px-5">
                    {filteredData.villages.map((village, idx) => (
                      <VillageCardLarge key={village.id} village={village} index={idx} />
                    ))}
                  </div>
                </motion.section>
              )}
              
              {/* Tourism Section */}
              {showTourism && filteredData.tourism.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <SectionHeader 
                    title="Destinasi Wisata"
                    subtitle={`${filteredData.tourism.length} tempat wisata`}
                    href="/tourism"
                    icon={<Camera className="h-4 w-4" />}
                  />
                  <div className="space-y-3">
                    {filteredData.tourism.slice(0, activeCategory === 'tourism' ? undefined : 3).map((tourism, idx) => (
                      <TourismCardCompact key={tourism.id} tourism={tourism} index={idx} />
                    ))}
                  </div>
                </motion.section>
              )}
              
              {/* Products Section */}
              {showProducts && filteredData.products.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <SectionHeader 
                    title="Produk Pilihan"
                    subtitle={`${filteredData.products.length} produk UMKM`}
                    href="/products"
                    icon={<ShoppingBag className="h-4 w-4" />}
                  />
                  <div className="space-y-3">
                    {filteredData.products.slice(0, activeCategory === 'products' ? undefined : 4).map((product, idx) => (
                      <ProductCardHorizontal key={product.id} product={product} index={idx} />
                    ))}
                  </div>
                </motion.section>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
