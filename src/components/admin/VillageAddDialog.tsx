import { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, MapPin, UserCheck } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  fetchProvinces, fetchRegencies, fetchDistricts, fetchVillages,
  type Region 
} from '@/lib/addressApi';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { AdminLocationPicker } from './AdminLocationPicker';
import { reverseGeocode } from '@/hooks/useGeocoding';

interface VillageAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AvailableUser {
  user_id: string;
  full_name: string | null;
  phone: string | null;
}

function findCodeByName(items: Region[], name: string | null): string {
  if (!name) return '';
  const normalized = name.trim().toUpperCase();
  return items.find(i => i.name.trim().toUpperCase() === normalized)?.code || '';
}

export function VillageAddDialog({
  open,
  onOpenChange,
  onSuccess,
}: VillageAddDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('none_value');
  
  const [formData, setFormData] = useState({
    name: '',
    province_code: '',
    province_name: '',
    regency_code: '',
    regency_name: '',
    district_code: '',
    district_name: '',
    subdistrict_code: '',
    subdistrict_name: '',
    description: '',
    image_url: '',
    location_lat: null as number | null,
    location_lng: null as number | null,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    is_active: true,
  });

  // Region lists
  const [provincesList, setProvincesList] = useState<Region[]>([]);
  const [regenciesList, setRegenciesList] = useState<Region[]>([]);
  const [districtsList, setDistrictsList] = useState<Region[]>([]);
  const [subdistrictsList, setSubdistrictsList] = useState<Region[]>([]);

  useEffect(() => {
    if (open) {
      loadProvinces();
      loadAvailableUsers();
    } else {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      name: '', province_code: '', province_name: '',
      regency_code: '', regency_name: '', district_code: '', district_name: '',
      subdistrict_code: '', subdistrict_name: '', description: '', image_url: '',
      location_lat: null, location_lng: null,
      contact_name: '', contact_phone: '', contact_email: '', is_active: true,
    });
    setSelectedUserId('none_value');
    setRegenciesList([]);
    setDistrictsList([]);
    setSubdistrictsList([]);
  };

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: desaRoles } = await supabase
        .from('user_roles').select('user_id').eq('role', 'admin_desa');
      if (!desaRoles || desaRoles.length === 0) { setAvailableUsers([]); setLoadingUsers(false); return; }

      const desaUserIds = desaRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles').select('user_id, full_name, phone').in('user_id', desaUserIds);

      // Get already linked user_ids
      const { data: linkedVillages } = await supabase
        .from('user_villages').select('user_id');
      const linkedUserIds = new Set(linkedVillages?.map(v => v.user_id) || []);

      setAvailableUsers((profiles || []).filter(p => !linkedUserIds.has(p.user_id)));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadProvinces = async () => {
    try {
      setLoadingRegions(true);
      const data = await fetchProvinces();
      setProvincesList(data);
    } catch (error) {
      console.error('Error loading provinces:', error);
      toast.error('Gagal memuat data provinsi');
    } finally {
      setLoadingRegions(false);
    }
  };

  // --- Address handlers ---
  const handleProvinceChange = async (code: string) => {
    const selected = provincesList.find(p => p.code === code);
    if (!selected) return;
    setRegenciesList([]); setDistrictsList([]); setSubdistrictsList([]);
    setFormData(prev => ({
      ...prev,
      province_code: code, province_name: selected.name,
      regency_code: '', regency_name: '', district_code: '', district_name: '',
      subdistrict_code: '', subdistrict_name: '',
    }));
    const regList = await fetchRegencies(code);
    setRegenciesList(regList);
  };

  const handleRegencyChange = async (code: string) => {
    const selected = regenciesList.find(r => r.code === code);
    if (!selected) return;
    setDistrictsList([]); setSubdistrictsList([]);
    setFormData(prev => ({
      ...prev,
      regency_code: code, regency_name: selected.name,
      district_code: '', district_name: '', subdistrict_code: '', subdistrict_name: '',
    }));
    const distList = await fetchDistricts(code);
    setDistrictsList(distList);
  };

  const handleDistrictChange = async (code: string) => {
    const selected = districtsList.find(d => d.code === code);
    if (!selected) return;
    setSubdistrictsList([]);
    setFormData(prev => ({
      ...prev,
      district_code: code, district_name: selected.name,
      subdistrict_code: '', subdistrict_name: '',
    }));
    const villList = await fetchVillages(code);
    setSubdistrictsList(villList);
  };

  const handleSubdistrictChange = (code: string) => {
    const selected = subdistrictsList.find(s => s.code === code);
    if (!selected) return;
    setFormData(prev => ({ ...prev, subdistrict_code: code, subdistrict_name: selected.name }));
  };

  // --- Map → auto-fill address ---
  const handleLocationChange = async (loc: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, location_lat: loc.lat, location_lng: loc.lng }));
    try {
      const result = await reverseGeocode(loc.lat, loc.lng);
      if (result) {
        const provList = provincesList.length > 0 ? provincesList : await fetchProvinces();
        if (provincesList.length === 0) setProvincesList(provList);
        
        const provCode = findCodeByName(provList, result.province);
        if (provCode) {
          const regList = await fetchRegencies(provCode);
          setRegenciesList(regList);
          const regCode = findCodeByName(regList, result.city);

          let distCode = '', villCode = '';
          if (regCode) {
            const distList = await fetchDistricts(regCode);
            setDistrictsList(distList);
            distCode = findCodeByName(distList, result.district);
            if (distCode) {
              const villList = await fetchVillages(distCode);
              setSubdistrictsList(villList);
              villCode = findCodeByName(villList, result.village);
            }
          }

          setFormData(prev => ({
            ...prev,
            province_code: provCode, province_name: result.province || prev.province_name,
            regency_code: regCode, regency_name: result.city || prev.regency_name,
            district_code: distCode, district_name: result.district || prev.district_name,
            subdistrict_code: villCode, subdistrict_name: result.village || prev.subdistrict_name,
          }));
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('Nama desa wajib diisi'); return; }
    if (!formData.province_code) { toast.error('Provinsi wajib dipilih'); return; }
    if (!formData.regency_code) { toast.error('Kabupaten/Kota wajib dipilih'); return; }
    if (!formData.district_code) { toast.error('Kecamatan wajib dipilih'); return; }
    if (!formData.subdistrict_code) { toast.error('Kelurahan/Desa wajib dipilih'); return; }
    if (!formData.location_lat || !formData.location_lng) { toast.error('Lokasi pada peta wajib ditentukan'); return; }

    setLoading(true);
    try {
      const { data: villageData, error } = await supabase
        .from('villages')
        .insert({
          name: formData.name.trim(),
          province: formData.province_name,
          regency: formData.regency_name,
          district: formData.district_name,
          subdistrict: formData.subdistrict_name,
          description: formData.description || null,
          image_url: formData.image_url || null,
          location_lat: formData.location_lat,
          location_lng: formData.location_lng,
          contact_name: formData.contact_name || null,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          is_active: formData.is_active,
          registration_status: 'APPROVED',
          registered_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      // Link user if selected
      const userId = selectedUserId !== 'none_value' ? selectedUserId : null;
      if (userId && villageData) {
        await supabase.from('user_villages').upsert({
          user_id: userId,
          village_id: villageData.id,
          role: 'admin',
        }, { onConflict: 'user_id,village_id' });

        // Ensure user has admin_desa role
        const { data: existingRole } = await supabase
          .from('user_roles').select('id')
          .eq('user_id', userId).eq('role', 'admin_desa').maybeSingle();
        if (!existingRole) {
          await supabase.from('user_roles').insert({ user_id: userId, role: 'admin_desa' });
        }
      }

      toast.success('Desa wisata berhasil ditambahkan');
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding village:', error);
      toast.error('Gagal menambahkan desa wisata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Desa Wisata Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Basic Info + Image */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label>Nama Desa *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama desa wisata"
                />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat desa wisata"
                  rows={4}
                />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4" />
                Gambar Utama
              </Label>
              <ImageUpload
                bucket="village-images"
                path={`villages/${Date.now()}`}
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url || '' })}
                aspectRatio="video"
              />
            </div>
          </div>

          {/* Pengelola (User) */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Pengelola (User Admin Desa)
            </h4>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loadingUsers}>
              <SelectTrigger>
                <SelectValue placeholder={loadingUsers ? 'Memuat...' : 'Pilih pengelola'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none_value">-- Tanpa Pengelola --</SelectItem>
                {availableUsers.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.full_name || 'Tanpa Nama'} ({user.phone || user.user_id.slice(0, 8)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">User dengan role admin desa yang belum terhubung ke desa lain</p>
          </div>

          {/* Map */}
          <div className="border-t pt-4">
            <Label className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4" />
              Lokasi Peta * (klik peta untuk auto-isi alamat)
            </Label>
            <AdminLocationPicker
              value={formData.location_lat && formData.location_lng ? { lat: formData.location_lat, lng: formData.location_lng } : null}
              onChange={handleLocationChange}
            />
          </div>

          {/* Address Dropdowns */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Alamat Lengkap</p>
            {loadingRegions && <p className="text-xs text-muted-foreground animate-pulse mb-2">Memuat data alamat...</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provinsi *</Label>
                <Select value={formData.province_code} onValueChange={handleProvinceChange} disabled={loadingRegions}>
                  <SelectTrigger><SelectValue placeholder="Pilih provinsi" /></SelectTrigger>
                  <SelectContent>
                    {provincesList.map(p => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kabupaten/Kota *</Label>
                <Select value={formData.regency_code} onValueChange={handleRegencyChange} disabled={!formData.province_code || loadingRegions}>
                  <SelectTrigger><SelectValue placeholder={formData.province_code ? "Pilih kabupaten/kota" : "Pilih provinsi dulu"} /></SelectTrigger>
                  <SelectContent>
                    {regenciesList.map(r => <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kecamatan *</Label>
                <Select value={formData.district_code} onValueChange={handleDistrictChange} disabled={!formData.regency_code || loadingRegions}>
                  <SelectTrigger><SelectValue placeholder={formData.regency_code ? "Pilih kecamatan" : "Pilih kabupaten/kota dulu"} /></SelectTrigger>
                  <SelectContent>
                    {districtsList.map(d => <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kelurahan/Desa *</Label>
                <Select value={formData.subdistrict_code} onValueChange={handleSubdistrictChange} disabled={!formData.district_code || loadingRegions}>
                  <SelectTrigger><SelectValue placeholder={formData.district_code ? "Pilih kelurahan/desa" : "Pilih kecamatan dulu"} /></SelectTrigger>
                  <SelectContent>
                    {subdistrictsList.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Informasi Kontak</p>
            <div className="space-y-3">
              <div>
                <Label>Nama Kontak</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Nama penanggung jawab"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telepon</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
            />
            <Label>Desa aktif</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingRegions}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Tambah'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
