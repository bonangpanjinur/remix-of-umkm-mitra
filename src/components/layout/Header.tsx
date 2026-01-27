import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { InstallButton } from '@/components/pwa/InstallButton';
import { useWhitelabel } from '@/hooks/useWhitelabel';

export function Header() {
  const { settings } = useWhitelabel();

  return (
    <header className="bg-card sticky top-0 z-40 shadow-md px-5 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.siteName} 
              className="w-8 h-8 rounded-xl object-cover shadow-brand"
            />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-sm shadow-brand">
              <Leaf className="h-4 w-4" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-sm leading-none text-foreground">
              {settings.siteName}
            </h1>
            <p className="text-[9px] text-muted-foreground font-medium tracking-wide">
              {settings.siteTagline}
            </p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          <InstallButton />
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
