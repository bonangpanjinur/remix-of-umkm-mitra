import { Link } from 'react-router-dom';
import { MapPin, Eye, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Tourism } from '@/types';

interface TourismCardCompactProps {
  tourism: Tourism;
  index?: number;
}

export function TourismCardCompact({ tourism, index = 0 }: TourismCardCompactProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <Link
        to={`/tourism/${tourism.id}`}
        className="flex gap-3 bg-card rounded-xl p-3 border border-border shadow-sm hover:shadow-md transition-shadow group"
      >
        <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={tourism.image} 
            alt={tourism.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
          />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-bold text-sm text-card-foreground line-clamp-1 group-hover:text-primary transition">
              {tourism.name}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{tourism.villageName}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {tourism.viewCount && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Eye className="h-3 w-3" />
                <span>{tourism.viewCount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 text-gold fill-gold" />
              <span className="text-muted-foreground">4.8</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
