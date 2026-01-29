import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, User, Phone, Mail, ArrowLeft, CheckCircle, Building } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  fetchProvinces, fetchRegencies, fetchDistricts, fetchVillages,
  type Region 
} from '@/lib/addressApi';

const villageSchema = z.object({
  name: z.string().min(3, 'Nama desa minimal 3 karakter').max(100),
  province: z.string().min(1, 'Pilih provinsi'),
  regency: z.string().min(1, 'Pilih kabupaten/kota'),
  district: z.string().min(1, 'Pilih kecamatan'),
  subdistrict: z.string().min(1, 'Pilih kelurahan/desa'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter').max(500),
  contactName: z.string().min(3, 'Nama kontak minimal 3 karakter').max(100),
  contactPhone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15),
  contactEmail: z.string().email('Email tidak valid'),
});

type VillageFormData = z.infer<typeof villageSchema>;

export default function RegisterVillagePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Address cascading states
  const [provincesList, setProvincesList] = useState<Region[]>([]);
  const [regenciesList, setRegenciesList] = useState<Region[]>([]);
  const [districtsList, setDistrictsList] = useState<Region[]>([]);
  const [subdistrictsList, setSubdistrictsList] = useState<Region[]>([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedRegency, setSelectedRegency] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<VillageFormData>({
    resolver: zodResolver(villageSchema),
  });

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await fetchProvinces();
        setProvincesList(data);
      } catch (error) {
        console.error('Error loading provinces:', error);
      }
    };
    loadProvinces();
  }, []);

  // Load regencies when province changes
  useEffect(() => {
    const loadRegencies = async () => {
      if (selectedProvince) {
        try {
          const data = await fetchRegencies(selectedProvince);
          setRegenciesList(data);
          // Reset dependent fields
          setSelectedRegency('');
          setSelectedDistrict('');
          setDistrictsList([]);
          setSubdistrictsList([]);
          setValue('regency', '');
          setValue('district', '');
          setValue('subdistrict', '');
        } catch (error) {
          console.error('Error loading regencies:', error);
        }
      }
    };
    loadRegencies();
  }, [selectedProvince, setValue]);

  // Load districts when regency changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (selectedRegency) {
        try {
          const data = await fetchDistricts(selectedRegency);
          setDistrictsList(data);
          // Reset dependent fields
          setSelectedDistrict('');
          setSubdistrictsList([]);
          setValue('district', '');
          setValue('subdistrict', '');
        } catch (error) {
          console.error('Error loading districts:', error);
        }
      }
    };
    loadDistricts();
  }, [selectedRegency, setValue]);

  // Load subdistricts when district changes
  useEffect(() => {
    const loadSubdistricts = async () => {
      if (selectedDistrict) {
        try {
          const data = await fetchVillages(selectedDistrict);
          setSubdistrictsList(data);
          setValue('subdistrict', '');
        } catch (error) {
          console.error('Error loading subdistricts:', error);
        }
      }
    };
    loadSubdistricts();
  }, [selectedDistrict, setValue]);

  const onSubmit = async (data: VillageFormData) => {
    setIsSubmitting(true);
    try {
      const provinceName = provincesList.find(p => p.code === data.province)?.name || '';
      const regencyName = regenciesList.find(r => r.code === data.regency)?.name || '';
      const districtName = districtsList.find(d => d.code === data.district)?.name || '';
      const subdistrictName = subdistrictsList.find(s => s.code === data.subdistrict)?.name || '';

      const { error } = await supabase.from('villages').insert({
        name: data.name.trim(),
        province: provinceName,
        regency: regencyName,
        district: districtName,
        subdistrict: subdistrictName,
        description: data.description.trim(),
        contact_name: data.contactName.trim(),
        contact_phone: data.contactPhone.trim(),
        contact_email: data.contactEmail.trim().toLowerCase(),
        registration_status: 'PENDING',
        is_active: false,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Pendaftaran desa berhasil dikirim!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Gagal mendaftar desa');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mobile-shell bg-background flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Pendaftaran Terkirim!
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Pendaftaran desa wisata Anda sedang dalam proses verifikasi oleh Admin. 
              Kami akan menghubungi Anda melalui email atau telepon setelah disetujui.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Kembali ke Beranda
            </Button>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="mobile-shell bg-background flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 py-4">
          {/* Back button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground text-sm mb-4 hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Daftarkan Desa</h1>
                <p className="text-xs text-muted-foreground">
                  Daftar sebagai Desa Wisata
                </p>
              </div>
            </div>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6"
          >
            <p className="text-xs text-foreground">
              <strong>Proses Verifikasi:</strong> Pendaftaran akan diverifikasi oleh Admin dalam 1-3 hari kerja. 
              Pastikan data yang diisi valid dan dapat dihubungi.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* Village Info Section */}
            <div className="space-y-4">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Informasi Desa
              </h2>

              <div>
                <Label htmlFor="name" className="text-xs">Nama Desa Wisata *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Desa Wisata Sukamaju"
                  {...register('name')}
                  className="mt-1.5"
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Provinsi *</Label>
                  <Select 
                    onValueChange={(value) => {
                      setSelectedProvince(value);
                      setValue('province', value);
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Pilih provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      {provincesList.map((p) => (
                        <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.province && (
                    <p className="text-destructive text-xs mt-1">{errors.province.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs">Kabupaten/Kota *</Label>
                  <Select 
                    onValueChange={(value) => {
                      setSelectedRegency(value);
                      setValue('regency', value);
                    }}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder={selectedProvince ? "Pilih kabupaten/kota" : "Pilih provinsi dulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {regenciesList.map((r) => (
                        <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.regency && (
                    <p className="text-destructive text-xs mt-1">{errors.regency.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Kecamatan *</Label>
                    <Select 
                      onValueChange={(value) => {
                        setSelectedDistrict(value);
                        setValue('district', value);
                      }}
                      disabled={!selectedRegency}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Pilih kecamatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {districtsList.map((d) => (
                          <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.district && (
                      <p className="text-destructive text-xs mt-1">{errors.district.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs">Kelurahan/Desa *</Label>
                    <Select 
                      onValueChange={(value) => {
                        setValue('subdistrict', value);
                      }}
                      disabled={!selectedDistrict}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Pilih kelurahan" />
                      </SelectTrigger>
                      <SelectContent>
                        {subdistrictsList.map((s) => (
                          <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subdistrict && (
                      <p className="text-destructive text-xs mt-1">{errors.subdistrict.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-xs">Deskripsi Desa *</Label>
                <Textarea
                  id="description"
                  placeholder="Ceritakan tentang desa wisata Anda, potensi wisata, budaya, dan keunikannya..."
                  {...register('description')}
                  className="mt-1.5 min-h-[100px]"
                />
                {errors.description && (
                  <p className="text-destructive text-xs mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4 pt-2">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Kontak Penanggung Jawab
              </h2>

              <div>
                <Label htmlFor="contactName" className="text-xs">Nama Lengkap *</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactName"
                    placeholder="Nama penanggung jawab"
                    {...register('contactName')}
                    className="pl-10"
                  />
                </div>
                {errors.contactName && (
                  <p className="text-destructive text-xs mt-1">{errors.contactName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPhone" className="text-xs">Nomor Telepon/WhatsApp *</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactPhone"
                    placeholder="08xxxxxxxxxx"
                    {...register('contactPhone')}
                    className="pl-10"
                  />
                </div>
                {errors.contactPhone && (
                  <p className="text-destructive text-xs mt-1">{errors.contactPhone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactEmail" className="text-xs">Email *</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="email@contoh.com"
                    {...register('contactEmail')}
                    className="pl-10"
                  />
                </div>
                {errors.contactEmail && (
                  <p className="text-destructive text-xs mt-1">{errors.contactEmail.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                  Mengirim...
                </>
              ) : (
                'Kirim Pendaftaran'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Dengan mendaftar, Anda menyetujui syarat dan ketentuan yang berlaku
            </p>
          </motion.form>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
