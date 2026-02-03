import { useState, useEffect } from 'react';
import { Save, Loader2, Image as ImageIcon, Palette, Globe, Type, Upload, CheckCircle2, Info, RefreshCw, Search, Plus, Edit2, Trash2, Eye, EyeOff, Share2, Layout, GripVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useWhitelabel } from '@/hooks/useWhitelabel';

interface PWASettings {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  enableOffline: boolean;
  enableNotifications: boolean;
  enableInstallPrompt: boolean;
  installPromptDelay: number;
  showInstallBanner: boolean;
  icons: {
    src: string;
    sizes: string;
    type: string;
  }[];
}

interface SEOSetting {
  id: string;
  page_path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  canonical_url: string | null;
  robots: string;
}

interface HomepageSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

interface HomepageLayoutSettings {
  sections: HomepageSection[];
  visible_categories: string[];
}

const DEFAULT_PWA_SETTINGS: PWASettings = {
  appName: 'DesaMart - Marketplace UMKM & Desa Wisata',
  shortName: 'DesaMart',
  description: 'Jelajahi produk UMKM asli desa dan destinasi wisata desa di Indonesia',
  themeColor: '#10b981',
  backgroundColor: '#ffffff',
  enableOffline: true,
  enableNotifications: true,
  enableInstallPrompt: true,
  installPromptDelay: 30,
  showInstallBanner: true,
  icons: [
    { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
  ],
};

const COMMON_PAGES = [
  { path: '/', label: 'Beranda' },
  { path: '/products', label: 'Produk' },
  { path: '/tourism', label: 'Wisata' },
  { path: '/explore', label: 'Explore' },
  { path: '/shops', label: 'Toko' },
  { path: '/search', label: 'Pencarian' },
  { path: '/auth', label: 'Login' },
];

const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: 'hero', name: 'Hero Banner', enabled: true, order: 0 },
  { id: 'categories', name: 'Kategori', enabled: true, order: 1 },
  { id: 'popular_tourism', name: 'Wisata Populer', enabled: true, order: 2 },
  { id: 'promo', name: 'Promo Spesial', enabled: true, order: 3 },
  { id: 'recommendations', name: 'Rekomendasi Pilihan', enabled: true, order: 4 },
  { id: 'villages', name: 'Jelajahi Desa', enabled: true, order: 5 },
];

const ALL_CATEGORIES = [
  { id: 'kuliner', name: 'Kuliner' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'kriya', name: 'Kriya' },
  { id: 'wisata', name: 'Wisata' },
];

interface BrandingAppearanceSettingsProps {
  isSaving?: string | null;
  onSave?: (key: string, values: any) => Promise<void>;
}

export function BrandingAppearanceSettings({ isSaving: externalIsSaving, onSave }: BrandingAppearanceSettingsProps) {
  const { refetch: refetchWhitelabel } = useWhitelabel();
  
  // Whitelabel State
  const [siteName, setSiteName] = useState('DesaMart');
  const [siteTagline, setSiteTagline] = useState('EKOSISTEM UMKM');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  
  // PWA State
  const [pwaSettings, setPwaSettings] = useState<PWASettings>(DEFAULT_PWA_SETTINGS);
  const [uploading, setUploading] = useState<string | null>(null);
  
  // SEO State
  const [seoSettings, setSeoSettings] = useState<SEOSetting[]>([]);
  const [seoDialogOpen, setSeoDialogOpen] = useState(false);
  const [editingSeo, setEditingSeo] = useState<SEOSetting | null>(null);
  const [seoSearchTerm, setSeoSearchTerm] = useState('');
  const [seoFormData, setSeoFormData] = useState({
    page_path: '',
    title: '',
    description: '',
    keywords: '',
    og_image: '',
    og_title: '',
    og_description: '',
    canonical_url: '',
    robots: 'index, follow',
  });

  // Homepage Layout State
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(DEFAULT_HOMEPAGE_SECTIONS);
  const [visibleCategories, setVisibleCategories] = useState<string[]>(ALL_CATEGORIES.map(c => c.id));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Loading & Saving State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    setLoading(true);
    try {
      // Fetch Whitelabel
      const { data: whitelabelData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('category', 'whitelabel');

      if (whitelabelData) {
        whitelabelData.forEach((item) => {
          if (item.key === 'site_name') setSiteName(String(item.value) || 'DesaMart');
          if (item.key === 'site_tagline') setSiteTagline(String(item.value) || 'EKOSISTEM UMKM');
          if (item.key === 'logo_url') setLogoUrl(item.value ? String(item.value) : null);
          if (item.key === 'favicon_url') setFaviconUrl(item.value ? String(item.value) : null);
        });
      }

      // Fetch PWA
      const { data: pwaData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('category', 'pwa')
        .single();

      if (pwaData && pwaData.value) {
        setPwaSettings({ ...DEFAULT_PWA_SETTINGS, ...(pwaData.value as any) });
      }

      // Fetch SEO
      const { data: seoData } = await supabase
        .from('seo_settings')
        .select('*')
        .order('page_path');
      setSeoSettings(seoData || []);

      // Fetch Homepage Layout
      const { data: layoutData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'homepage_layout')
        .maybeSingle();

      if (layoutData?.value) {
        const settings = layoutData.value as unknown as HomepageLayoutSettings;
        if (settings.sections) setHomepageSections(settings.sections.sort((a, b) => a.order - b.order));
        if (settings.visible_categories) setVisibleCategories(settings.visible_categories);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal memuat beberapa pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWhitelabel = async () => {
    setSaving('whitelabel');
    try {
      const saveSetting = async (key: string, value: string | null) => {
        const { data: existing } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', key)
          .eq('category', 'whitelabel')
          .maybeSingle();

        if (existing) {
          await supabase
            .from('app_settings')
            .update({ value: value as any, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('app_settings')
            .insert({
              key,
              value: value as any,
              category: 'whitelabel',
              description: `Whitelabel setting: ${key}`,
            });
        }
      };

      await Promise.all([
        saveSetting('site_name', siteName),
        saveSetting('site_tagline', siteTagline),
        saveSetting('logo_url', logoUrl),
        saveSetting('favicon_url', faviconUrl),
      ]);

      await refetchWhitelabel();
      toast.success('Pengaturan Whitelabel berhasil disimpan');
    } catch (error) {
      console.error('Error saving whitelabel:', error);
      toast.error('Gagal menyimpan pengaturan Whitelabel');
    } finally {
      setSaving(null);
    }
  };

  const handleSavePWA = async () => {
    setSaving('pwa');
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'pwa_config',
          category: 'pwa',
          value: pwaSettings as any,
          description: 'Progressive Web App configuration',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Pengaturan PWA berhasil disimpan');
    } catch (error) {
      console.error('Error saving PWA:', error);
      toast.error('Gagal menyimpan pengaturan PWA');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveSeo = async () => {
    if (!seoFormData.page_path) {
      toast.error('Path halaman wajib diisi');
      return;
    }

    setSaving('seo');
    try {
      const seoData = {
        page_path: seoFormData.page_path,
        title: seoFormData.title || null,
        description: seoFormData.description || null,
        keywords: seoFormData.keywords || null,
        og_image: seoFormData.og_image || null,
        og_title: seoFormData.og_title || null,
        og_description: seoFormData.og_description || null,
        canonical_url: seoFormData.canonical_url || null,
        robots: seoFormData.robots,
      };

      if (editingSeo) {
        const { error } = await supabase
          .from('seo_settings')
          .update(seoData)
          .eq('id', editingSeo.id);
        if (error) throw error;
        toast.success('SEO settings diperbarui');
      } else {
        const { error } = await supabase
          .from('seo_settings')
          .insert([seoData]);
        if (error) throw error;
        toast.success('SEO settings ditambahkan');
      }

      setSeoDialogOpen(false);
      setEditingSeo(null);
      setSeoFormData({
        page_path: '', title: '', description: '', keywords: '',
        og_image: '', og_title: '', og_description: '',
        canonical_url: '', robots: 'index, follow',
      });
      
      const { data } = await supabase.from('seo_settings').select('*').order('page_path');
      setSeoSettings(data || []);
    } catch (error: any) {
      console.error('Error saving SEO:', error);
      toast.error(error.code === '23505' ? 'Path halaman sudah ada' : 'Gagal menyimpan SEO');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveLayout = async () => {
    setSaving('layout');
    try {
      const settings: HomepageLayoutSettings = {
        sections: homepageSections.map((s, index) => ({ ...s, order: index })),
        visible_categories: visibleCategories,
      };

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'homepage_layout',
          category: 'layout',
          value: settings as any,
          description: 'Homepage layout configuration',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Pengaturan Layout berhasil disimpan');
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Gagal menyimpan pengaturan Layout');
    } finally {
      setSaving(null);
    }
  };

  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>, size: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.includes('png') && !file.type.includes('jpeg')) {
      toast.error('Hanya file PNG atau JPEG yang diperbolehkan');
      return;
    }

    setUploading(size);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pwa-icon-${size}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `pwa/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      const updatedIcons = pwaSettings.icons.map(icon => 
        icon.sizes === size ? { ...icon, src: publicUrl, type: file.type } : icon
      );

      setPwaSettings(prev => ({ ...prev, icons: updatedIcons }));
      toast.success(`Ikon ${size} berhasil diunggah`);
    } catch (error: any) {
      console.error('Error uploading icon:', error);
      toast.error('Gagal mengunggah ikon');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="identity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="identity">Identitas</TabsTrigger>
          <TabsTrigger value="pwa">Mobile (PWA)</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" /> Identitas Brand</CardTitle>
                <CardDescription>Ubah nama dan tagline website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nama Website</Label>
                  <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteTagline">Tagline</Label>
                  <Input id="siteTagline" value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Logo & Favicon</CardTitle>
                <CardDescription>Upload logo dan favicon website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo Website</Label>
                  <ImageUpload value={logoUrl || ''} onChange={setLogoUrl} bucket="merchant-images" path="whitelabel/logo" />
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <ImageUpload value={faviconUrl || ''} onChange={setFaviconUrl} bucket="merchant-images" path="whitelabel/favicon" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Button onClick={handleSaveWhitelabel} disabled={saving === 'whitelabel'}>
            {saving === 'whitelabel' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Identitas
          </Button>
        </TabsContent>

        {/* PWA Tab */}
        <TabsContent value="pwa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Informasi PWA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Aplikasi</Label>
                  <Input value={pwaSettings.appName} onChange={(e) => setPwaSettings({...pwaSettings, appName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Nama Singkat</Label>
                  <Input value={pwaSettings.shortName} maxLength={12} onChange={(e) => setPwaSettings({...pwaSettings, shortName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi PWA</Label>
                <Textarea value={pwaSettings.description} onChange={(e) => setPwaSettings({...pwaSettings, description: e.target.value})} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Ikon PWA</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {pwaSettings.icons.map((icon, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden border">
                    {uploading === icon.sizes ? <Loader2 className="h-6 w-6 animate-spin" /> : <img src={icon.src} className="w-full h-full object-contain" />}
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs font-bold">{icon.sizes}</Label>
                    <Input type="file" accept="image/png,image/jpeg" className="hidden" id={`pwa-icon-${icon.sizes}`} onChange={(e) => handleIconUpload(e, icon.sizes)} />
                    <Button variant="outline" size="sm" className="w-full mt-1" asChild>
                      <label htmlFor={`pwa-icon-${icon.sizes}`} className="cursor-pointer"><Upload className="h-3 w-3 mr-2" /> Ganti</label>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button onClick={handleSavePWA} disabled={saving === 'pwa'}>
            {saving === 'pwa' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Pengaturan PWA
          </Button>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari path..." className="pl-8" value={seoSearchTerm} onChange={(e) => setSeoSearchTerm(e.target.value)} />
            </div>
            <Button onClick={() => { setEditingSeo(null); setSeoDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Tambah SEO</Button>
          </div>
          <div className="grid gap-4">
            {seoSettings.filter(s => s.page_path.includes(seoSearchTerm)).map(setting => (
              <Card key={setting.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{setting.page_path}</p>
                    <p className="text-xs text-muted-foreground">{setting.title || 'Tanpa Judul'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingSeo(setting);
                      setSeoFormData({
                        page_path: setting.page_path, title: setting.title || '', description: setting.description || '',
                        keywords: setting.keywords || '', og_image: setting.og_image || '', og_title: setting.og_title || '',
                        og_description: setting.og_description || '', canonical_url: setting.canonical_url || '', robots: setting.robots,
                      });
                      setSeoDialogOpen(true);
                    }}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => {
                      if (confirm('Hapus SEO ini?')) {
                        await supabase.from('seo_settings').delete().eq('id', setting.id);
                        fetchAllSettings();
                      }
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" /> Urutan Section Homepage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {homepageSections.map((section, index) => (
                <div key={section.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1">{section.name}</span>
                  <Switch checked={section.enabled} onCheckedChange={() => {
                    const newSections = [...homepageSections];
                    newSections[index].enabled = !newSections[index].enabled;
                    setHomepageSections(newSections);
                  }} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Button onClick={handleSaveLayout} disabled={saving === 'layout'}>
            {saving === 'layout' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Layout
          </Button>
        </TabsContent>
      </Tabs>

      {/* SEO Dialog */}
      <Dialog open={seoDialogOpen} onOpenChange={setSeoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSeo ? 'Edit SEO' : 'Tambah SEO'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Path Halaman</Label>
              <Input value={seoFormData.page_path} onChange={e => setSeoFormData({...seoFormData, page_path: e.target.value})} placeholder="/products" />
            </div>
            <div className="space-y-2">
              <Label>SEO Title</Label>
              <Input value={seoFormData.title} onChange={e => setSeoFormData({...seoFormData, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea value={seoFormData.description} onChange={e => setSeoFormData({...seoFormData, description: e.target.value})} />
            </div>
          </div>
          <Button onClick={handleSaveSeo} disabled={saving === 'seo'}>Simpan SEO</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
