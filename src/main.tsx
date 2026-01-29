import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

// Function to generate and inject dynamic manifest
const injectDynamicManifest = async () => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('category', 'pwa')
      .eq('key', 'pwa_config')
      .single();

    if (data && !error) {
      const config = data.value as any;
      const manifest = {
        name: config.appName || "DesaMart",
        short_name: config.shortName || "DesaMart",
        description: config.description || "",
        start_url: "/",
        display: "standalone",
        background_color: config.backgroundColor || "#ffffff",
        theme_color: config.themeColor || "#10b981",
        icons: config.icons.map((icon: any) => ({
          src: icon.src,
          sizes: icon.sizes,
          type: icon.type,
          purpose: "any maskable"
        }))
      };

      const stringManifest = JSON.stringify(manifest);
      const blob = new Blob([stringManifest], { type: 'application/json' });
      const manifestURL = URL.createObjectURL(blob);
      
      const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (link) {
        link.setAttribute('href', manifestURL);
      }
    }
  } catch (err) {
    console.error("Failed to inject dynamic manifest", err);
  }
};

injectDynamicManifest();

createRoot(document.getElementById("root")!).render(<App />);
