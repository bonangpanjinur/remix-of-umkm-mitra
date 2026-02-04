import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddressDropdowns } from './AddressDropdowns';

interface AddCourierDialogProps {
  onSuccess: () => void;
}

export function AddCourierDialog({ onSuccess }: AddCourierDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [villages, setVillages] = useState<{id: string, name: string}[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    province_code: '',
    province_name: '',
    regency_code: '',
    regency_name: '',
    district_code: '',
    district_name: '',
    village_code: '',
    village_name: '',
    address: '',
    ktp_number: '',
    vehicle_type: 'motor',
    vehicle_plate: '',
    village_id: '',
  });

  useEffect(() => {
    const fetchVillages = async () => {
      const { data } = await supabase.from('villages').select('id, name').order('name');
      if (data) setVillages(data);
    };
    
    if (open) {
      fetchVillages();
    }
  }, [open]);

  const handleAddressChange = (data: {
    provinceCode: string;
    provinceName: string;
    regencyCode: string;
    regencyName: string;
    districtCode: string;
    districtName: string;
    villageCode: string;
    villageName: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      province_code: data.provinceCode,
      province_name: data.provinceName,
      regency_code: data.regencyCode,
      regency_name: data.regencyName,
      district_code: data.districtCode,
      district_name: data.districtName,
      village_code: data.villageCode,
      village_name: data.villageName,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.ktp_number) {
      toast.error('Nama, telepon, dan No. KTP wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('couriers').insert({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        province: formData.province_name,
        city: formData.regency_name,
        district: formData.district_name,
        subdistrict: formData.village_name,
        address: formData.address,
        ktp_number: formData.ktp_number,
        ktp_image_url: 'https://placeholder.co/400x300?text=KTP', 
        photo_url: 'https://placeholder.co/200x200?text=Foto',
        vehicle_type: formData.vehicle_type,
        vehicle_plate: formData.vehicle_plate || null,
        vehicle_image_url: 'https://placeholder.co/400x300?text=Kendaraan',
        registration_status: 'APPROVED', 
        status: 'ACTIVE',
        approved_at: new Date().toISOString(),
        village_id: formData.village_id || null,
      });

      if (error) throw error;

      toast.success('Kurir berhasil ditambahkan dan otomatis aktif');
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding courier:', error);
      toast.error('Gagal menambahkan kurir: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      province_code: '',
      province_name: '',
      regency_code: '',
      regency_name: '',
      district_code: '',
      district_name: '',
      village_code: '',
      village_name: '',
      address: '',
      ktp_number: '',
      vehicle_type: 'motor',
      vehicle_plate: '',
      village_id: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Kurir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Kurir Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama kurir sesuai KTP"
              />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@contoh.com"
              />
            </div>
          </div>

          {/* Identity */}
          <div className="space-y-2">
            <Label>No. KTP *</Label>
            <Input
              value={formData.ktp_number}
              onChange={(e) => setFormData({ ...formData, ktp_number: e.target.value })}
              placeholder="16 digit nomor KTP"
              maxLength={16}
            />
          </div>

          {/* Address Dropdowns */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Alamat</h4>
            <AddressDropdowns
              provinceCode={formData.province_code}
              regencyCode={formData.regency_code}
              districtCode={formData.district_code}
              villageCode={formData.village_code}
              provinceName={formData.province_name}
              regencyName={formData.regency_name}
              districtName={formData.district_name}
              villageName={formData.village_name}
              onChange={handleAddressChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Alamat Lengkap</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Jl. Contoh No. 123"
              rows={2}
            />
          </div>

          {/* Vehicle & Village */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Jenis Kendaraan</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="motor">Motor</SelectItem>
                  <SelectItem value="mobil">Mobil</SelectItem>
                  <SelectItem value="sepeda">Sepeda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plat Nomor</Label>
              <Input
                value={formData.vehicle_plate}
                onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                placeholder="B 1234 ABC"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Wilayah Desa (Opsional)</Label>
            <Select
              value={formData.village_id || "none"}
              onValueChange={(v) => setFormData({ ...formData, village_id: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Desa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa Wilayah</SelectItem>
                {villages.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Tambah Kurir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
