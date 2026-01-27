import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export function Header() {
  return (
    <header className="bg-card sticky top-0 z-40 shadow-md px-5 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-sm shadow-brand">
            <Leaf className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none text-foreground">
              Desa<span className="text-primary">Mart</span>
            </h1>
            <p className="text-[9px] text-muted-foreground font-medium tracking-wide">
              EKOSISTEM UMKM
            </p>
          </div>
        </Link>
        
        <NotificationDropdown />
      </div>
    </header>
  );
}
