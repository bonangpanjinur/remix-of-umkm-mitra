import { useState, useEffect } from 'react';
import { Clock, Save, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MerchantEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  initialData: {
    name: string;
    phone: string | null;
    address: string | null;
    province: string | null;
    city: string | null;
    district: string | null;
    subdistrict: string | null;
    open_time: string | null;
    close_time: string | null;
    business_category: string | null;
    business_description: string | null;
    is_open: boolean;
    status: string;
    badge: string | null;
    order_mode: string;
    is_verified: boolean | null;
    image_url: string | null;
  };
  onSuccess: () => void;
}

const BUSINESS_CATEGORIES = [
  { value: 'kuliner', label: 'Kuliner' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'kriya', label: 'Kriya & Kerajinan' },
  { value: 'jasa', label: 'Jasa' },
  { value: 'pertanian', label: 'Pertanian' },
  { value: 'lainnya', label: 'Lainnya' },
];

const BADGES = [
  { value: 'none', label: 'Tanpa Badge' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'POPULAR', label: 'Popular' },
  { value: 'NEW', label: 'New' },
];

export function MerchantEditDialog({
  open,
  onOpenChange,
  merchantId,
  initialData,
  onSuccess,
}: MerchantEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    province: '',
    city: '',
    district: '',
    subdistrict: '',
    open_time: '08:00',
    close_time: '17:00',
    business_category: 'kuliner',
    business_description: '',
    is_open: true,
    status: 'ACTIVE',
    badge: 'none',
    order_mode: 'ADMIN_ASSISTED',
    is_verified: false,
    image_url: '',
  });

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        province: initialData.province || '',
        city: initialData.city || '',
        district: initialData.district || '',
        subdistrict: initialData.subdistrict || '',
        open_time: initialData.open_time || '08:00',
        close_time: initialData.close_time || '17:00',
        business_category: initialData.business_category || 'kuliner',
        business_description: initialData.business_description || '',
        is_open: initialData.is_open ?? true,
        status: initialData.status || 'ACTIVE',
        badge: initialData.badge || 'none',
        order_mode: initialData.order_mode || 'ADMIN_ASSISTED',
        is_verified: initialData.is_verified ?? false,
        image_url: initialData.image_url || '',
      });
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Nama merchant wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          province: formData.province || null,
          city: formData.city || null,
          district: formData.district || null,
          subdistrict: formData.subdistrict || null,
          open_time: formData.open_time,
          close_time: formData.close_time,
          business_category: formData.business_category,
          business_description: formData.business_description || null,
          is_open: formData.is_open,
          status: formData.status,
          badge: formData.badge === 'none' ? null : formData.badge,
          order_mode: formData.order_mode,
          is_verified: formData.is_verified,
          image_url: formData.image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', merchantId);

      if (error) throw error;

      toast.success('Data merchant berhasil diperbarui');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating merchant:', error);
      toast.error('Gagal memperbarui merchant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Merchant</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Informasi Dasar</h3>
            <div>
              <Label>Nama Merchant *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama toko/usaha"
              />
            </div>

            <div>
              <Label>Nomor Telepon</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <Label>Kategori Bisnis</Label>
              <Select
                value={formData.business_category}
                onValueChange={(v) => setFormData({ ...formData, business_category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Deskripsi Bisnis</Label>
              <Textarea
                value={formData.business_description}
                onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                placeholder="Deskripsi singkat tentang usaha"
                rows={3}
              />
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                URL Gambar Merchant
              </Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Lokasi & Operasional</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provinsi</Label>
                <Input
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Provinsi"
                />
              </div>
              <div>
                <Label>Kota/Kabupaten</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Kota/Kabupaten"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kecamatan</Label>
                <Input
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Kecamatan"
                />
              </div>
              <div>
                <Label>Desa/Kelurahan</Label>
                <Input
                  value={formData.subdistrict}
                  onChange={(e) => setFormData({ ...formData, subdistrict: e.target.value })}
                  placeholder="Desa/Kelurahan"
                />
              </div>
            </div>

            <div>
              <Label>Alamat Lengkap</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Alamat lengkap merchant"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Jam Buka
                </Label>
                <Input
                  type="time"
                  value={formData.open_time}
                  onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Jam Tutup
                </Label>
                <Input
                  type="time"
                  value={formData.close_time}
                  onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 md:col-span-2 border-t pt-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Pengaturan Sistem</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Status Merchant</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                      <SelectItem value="SUSPENDED">Ditangguhkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_open}
                    onCheckedChange={(v) => setFormData({ ...formData, is_open: v })}
                  />
                  <Label>Toko sedang buka</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Mode Pesanan</Label>
                  <Select
                    value={formData.order_mode}
                    onValueChange={(v) => setFormData({ ...formData, order_mode: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN_ASSISTED">Dibantu Admin</SelectItem>
                      <SelectItem value="SELF">Mandiri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_verified}
                    onCheckedChange={(v) => setFormData({ ...formData, is_verified: v })}
                  />
                  <Label>Terverifikasi</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Badge Merchant</Label>
                  <Select
                    value={formData.badge}
                    onValueChange={(v) => setFormData({ ...formData, badge: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGES.map((badge) => (
                        <SelectItem key={badge.value} value={badge.value}>
                          {badge.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
