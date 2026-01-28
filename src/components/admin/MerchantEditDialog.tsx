import { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
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
    open_time: string | null;
    close_time: string | null;
    business_category: string | null;
    business_description: string | null;
    is_open: boolean;
    status: string;
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
    open_time: '08:00',
    close_time: '17:00',
    business_category: 'kuliner',
    business_description: '',
    is_open: true,
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        open_time: initialData.open_time || '08:00',
        close_time: initialData.close_time || '17:00',
        business_category: initialData.business_category || 'kuliner',
        business_description: initialData.business_description || '',
        is_open: initialData.is_open ?? true,
        status: initialData.status || 'ACTIVE',
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
          open_time: formData.open_time,
          close_time: formData.close_time,
          business_category: formData.business_category,
          business_description: formData.business_description || null,
          is_open: formData.is_open,
          status: formData.status,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Merchant</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
            <Label>Alamat</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat lengkap merchant"
              rows={2}
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

          <div className="flex items-center gap-3 pt-2">
            <Switch
              checked={formData.is_open}
              onCheckedChange={(v) => setFormData({ ...formData, is_open: v })}
            />
            <Label>Toko sedang buka</Label>
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
