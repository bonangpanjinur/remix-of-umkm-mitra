import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';

interface ProductCardHorizontalProps {
  product: Product;
  index?: number;
}

export function ProductCardHorizontal({ product, index = 0 }: ProductCardHorizontalProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="flex gap-3 bg-card rounded-xl p-3 border border-border shadow-sm hover:shadow-md transition-shadow group"
      >
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
          />
          {product.isPromo && (
            <div className="absolute top-1 left-1">
              <span className="bg-destructive text-destructive-foreground text-[7px] font-bold px-1.5 py-0.5 rounded">
                PROMO
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground text-[10px] mb-0.5">
              <span className="truncate">{product.merchantName}</span>
              <Star className="h-2 w-2 text-gold fill-gold flex-shrink-0" />
            </div>
            <h3 className="font-bold text-sm text-card-foreground line-clamp-2 group-hover:text-primary transition">
              {product.name}
            </h3>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <p className="text-primary font-bold text-sm">
              {formatPrice(product.price)}
            </p>
            <button
              onClick={handleAddToCart}
              className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
