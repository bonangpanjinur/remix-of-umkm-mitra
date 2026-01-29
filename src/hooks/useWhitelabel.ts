import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhitelabelSettings {
  siteName: string;
  siteTagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  pwa?: {
    appName: string;
    shortName: string;
    description: string;
    themeColor: string;
    backgroundColor: string;
    icons: { src: string; sizes: string; type: string }[];
  };
}

const defaultSettings: WhitelabelSettings = {
  siteName: 'DesaMart',
  siteTagline: 'EKOSISTEM UMKM',
  logoUrl: null,
  faviconUrl: null,
};

interface WhitelabelContextType {
  settings: WhitelabelSettings;
  loading: boolean;
  refetch: () => Promise<void>;
}

const WhitelabelContext = createContext<WhitelabelContextType | undefined>(undefined);

export function useWhitelabel() {
  const context = useContext(WhitelabelContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      settings: defaultSettings,
      loading: false,
      refetch: async () => {},
    };
  }
  return context;
}

export function useWhitelabelProvider() {
  const [settings, setSettings] = useState<WhitelabelSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value, category');

      if (error) throw error;

      if (data && data.length > 0) {
        const newSettings = { ...defaultSettings };
        data.forEach((item) => {
          if (item.category === 'whitelabel') {
            if (item.key === 'site_name' && item.value) {
              newSettings.siteName = String(item.value);
            }
            if (item.key === 'site_tagline' && item.value) {
              newSettings.siteTagline = String(item.value);
            }
            if (item.key === 'logo_url' && item.value) {
              newSettings.logoUrl = String(item.value);
            }
            if (item.key === 'favicon_url' && item.value) {
              newSettings.faviconUrl = String(item.value);
            }
          }
          if (item.category === 'pwa' && item.key === 'pwa_config') {
            newSettings.pwa = item.value as any;
          }
        });
        setSettings(newSettings);

        // Update document title
        document.title = newSettings.siteName;

        // Update favicon if set
        if (newSettings.faviconUrl) {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = newSettings.faviconUrl;
          }
        }

        // Update PWA Meta Tags dynamically
        if (newSettings.pwa) {
          const pwa = newSettings.pwa;
          
          // Theme color
          let themeMeta = document.querySelector('meta[name="theme-color"]');
          if (themeMeta) themeMeta.setAttribute('content', pwa.themeColor);
          
          // Apple mobile web app title
          let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
          if (appleTitle) appleTitle.setAttribute('content', pwa.shortName);

          // Update icons
          if (pwa.icons && pwa.icons.length > 0) {
            const icon192 = pwa.icons.find(i => i.sizes === '192x192');
            const icon512 = pwa.icons.find(i => i.sizes === '512x512');

            if (icon192) {
              const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
              if (appleIcon) appleIcon.setAttribute('href', icon192.src);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching whitelabel settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    refetch: fetchSettings,
  };
}

export { WhitelabelContext, defaultSettings };
export type { WhitelabelSettings };
