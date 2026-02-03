import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Globe, Save, Image as ImageIcon, Eye, Info, Share2, Layout } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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

const COMMON_PAGES = [
  { path: '/', label: 'Beranda' },
  { path: '/products', label: 'Produk' },
  { path: '/tourism', label: 'Wisata' },
  { path: '/explore', label: 'Explore' },
  { path: '/shops', label: 'Toko' },
  { path: '/search', label: 'Pencarian' },
  { path: '/auth', label: 'Login' },
];

export default function AdminSEOPage() {
  const [settings, setSettings] = useState<SEOSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SEOSetting | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .order('page_path');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: SEOSetting) => {
    setEditingSetting(setting);
    setFormData({
      page_path: setting.page_path,
      title: setting.title || '',
      description: setting.description || '',
      keywords: setting.keywords || '',
      og_image: setting.og_image || '',
      og_title: setting.og_title || '',
      og_description: setting.og_description || '',
      canonical_url: setting.canonical_url || '',
      robots: setting.robots,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSetting(null);
    setFormData({
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
  };

  const handleSubmit = async () => {
    if (!formData.page_path) {
      toast.error('Path halaman wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const seoData = {
        page_path: formData.page_path,
        title: formData.title || null,
        description: formData.description || null,
        keywords: formData.keywords || null,
        og_image: formData.og_image || null,
        og_title: formData.og_title || null,
        og_description: formData.og_description || null,
        canonical_url: formData.canonical_url || null,
        robots: formData.robots,
      };

      if (editingSetting) {
        const { error } = await supabase
          .from('seo_settings')
          .update(seoData)
          .eq('id', editingSetting.id);

        if (error) throw error;
        toast.success('SEO settings berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('seo_settings')
          .insert([seoData]);

        if (error) throw error;
        toast.success('SEO settings berhasil ditambahkan');
      }

      setDialogOpen(false);
      resetForm();
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving SEO:', error);
      if (error.code === '23505') {
        toast.error('Path halaman sudah ada');
      } else {
        toast.error('Gagal menyimpan settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus SEO settings ini?')) return;

    try {
      const { error } = await supabase
        .from('seo_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('SEO settings dihapus');
      fetchSettings();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Gagal menghapus');
    }
  };

  const filteredSettings = settings.filter(s => 
    s.page_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.title && s.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout title="SEO Settings" subtitle="Optimalkan tampilan halaman di mesin pencari dan sosial media">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari path atau judul..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Tambah Konfigurasi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSetting ? 'Edit SEO Settings' : 'Tambah SEO Settings'}
                </DialogTitle>
                <DialogDescription>
                  Konfigurasikan meta tags untuk path {formData.page_path || 'baru'}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="general" className="py-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general" className="gap-2">
                    <Layout className="h-4 w-4" /> Umum
                  </TabsTrigger>
                  <TabsTrigger value="social" className="gap-2">
                    <Share2 className="h-4 w-4" /> Sosial
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" /> Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Path Halaman</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.page_path}
                        onChange={(e) => setFormData({ ...formData, page_path: e.target.value })}
                        placeholder="/products"
                        disabled={!!editingSetting}
                      />
                      {!editingSetting && (
                        <Select onValueChange={(value) => setFormData({ ...formData, page_path: value })}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Pilih" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_PAGES.map((page) => (
                              <SelectItem key={page.path} value={page.path}>
                                {page.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Title Tag</Label>
                      <span className={`text-xs ${formData.title.length > 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {formData.title.length}/60
                      </span>
                    </div>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Judul halaman (SEO Title)"
                      maxLength={70}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Meta Description</Label>
                      <span className={`text-xs ${formData.description.length > 160 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {formData.description.length}/160
                      </span>
                    </div>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Deskripsi singkat halaman untuk hasil pencarian"
                      maxLength={200}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Keywords</Label>
                      <Input
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        placeholder="umkm, desa, wisata"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Robots</Label>
                      <Select 
                        value={formData.robots} 
                        onValueChange={(value) => setFormData({ ...formData, robots: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="index, follow">Index, Follow</SelectItem>
                          <SelectItem value="noindex, follow">NoIndex, Follow</SelectItem>
                          <SelectItem value="index, nofollow">Index, NoFollow</SelectItem>
                          <SelectItem value="noindex, nofollow">NoIndex, NoFollow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Canonical URL (Opsional)</Label>
                    <Input
                      value={formData.canonical_url}
                      onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                      placeholder="https://desamart.id/path"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>OG Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.og_image}
                        onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                        placeholder="https://example.com/og-image.jpg"
                      />
                    </div>
                    {formData.og_image && (
                      <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border">
                        <img src={formData.og_image} alt="OG Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>OG Title</Label>
                    <Input
                      value={formData.og_title}
                      onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                      placeholder="Judul untuk sosial media (kosongkan untuk pakai Title Tag)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>OG Description</Label>
                    <Textarea
                      value={formData.og_description}
                      onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                      placeholder="Deskripsi untuk sosial media (kosongkan untuk pakai Meta Description)"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Google Search Preview</Label>
                    <div className="p-4 border rounded-lg bg-white dark:bg-zinc-900 space-y-1">
                      <div className="text-xs text-[#202124] dark:text-zinc-400 flex items-center gap-1">
                        https://desamart.id <span className="text-[10px]">▼</span>
                      </div>
                      <div className="text-xl text-[#1a0dab] dark:text-blue-400 hover:underline cursor-pointer truncate">
                        {formData.title || 'Judul Halaman Akan Muncul Di Sini'}
                      </div>
                      <div className="text-sm text-[#4d5156] dark:text-zinc-300 line-clamp-2">
                        {formData.description || 'Deskripsi halaman akan muncul di sini. Pastikan deskripsi menarik dan mengandung kata kunci yang relevan.'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Social Media Preview</Label>
                    <div className="border rounded-xl overflow-hidden bg-[#f2f3f5] dark:bg-zinc-800 max-w-[500px]">
                      <div className="aspect-video bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                        {formData.og_image ? (
                          <img src={formData.og_image} alt="Social" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-12 w-12 text-zinc-400" />
                        )}
                      </div>
                      <div className="p-3 space-y-1 border-t">
                        <div className="text-[12px] uppercase text-zinc-500">DESAMART.ID</div>
                        <div className="font-bold text-[16px] line-clamp-1">
                          {formData.og_title || formData.title || 'Judul Sosial Media'}
                        </div>
                        <div className="text-[14px] text-zinc-500 line-clamp-2">
                          {formData.og_description || formData.description || 'Deskripsi sosial media akan muncul di sini...'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Memuat data...</div>
          ) : filteredSettings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center space-y-3">
                <Globe className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <div className="space-y-1">
                  <p className="font-medium">Belum ada pengaturan SEO</p>
                  <p className="text-sm text-muted-foreground">Tambahkan konfigurasi SEO pertama Anda untuk mulai mengoptimalkan halaman.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                  Tambah Sekarang
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredSettings.map((setting) => (
              <Card key={setting.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {setting.page_path}
                            </Badge>
                            {setting.robots.includes('noindex') && (
                              <Badge variant="destructive" className="text-[10px]">No-Index</Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-lg">{setting.title || 'Tanpa Judul'}</h3>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(setting)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDelete(setting.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {setting.description || 'Tidak ada deskripsi.'}
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
                        <div className="flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" />
                          <span>{setting.keywords ? setting.keywords.split(',').length : 0} Keywords</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Share2 className="h-3.5 w-3.5" />
                          <span>{setting.og_image ? 'Social Ready' : 'No Social Image'}</span>
                        </div>
                      </div>
                    </div>
                    {setting.og_image && (
                      <div className="hidden md:block w-48 bg-muted relative">
                        <img src={setting.og_image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
