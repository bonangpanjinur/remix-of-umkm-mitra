import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  icon?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, href, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-bold text-base text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {href && (
        <Link 
          to={href}
          className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          Lihat Semua
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
