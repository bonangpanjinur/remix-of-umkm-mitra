import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export function InstallButton() {
  const { canInstall, isInstalled, installApp } = usePWA();

  const handleInstall = async () => {
    await installApp();
  };

  // Don't show if already installed or can't install
  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleInstall}
      className="h-8 gap-1.5 text-xs font-medium"
    >
      <Download className="h-3.5 w-3.5" />
      Install
    </Button>
  );
}
