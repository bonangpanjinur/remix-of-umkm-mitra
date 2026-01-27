import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, User, Phone, MapPin, ArrowLeft, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Village } from '@/types';

const merchantSchema = z.object({
  name: z.string().min(3, 'Nama usaha minimal 3 karakter').max(100),
  villageId: z.string().min(1, 'Pilih desa'),
  address: z.string().min(10, 'Alamat minimal 10 karakter').max(200),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15),
  openTime: z.string().min(1, 'Pilih jam buka'),
  closeTime: z.string().min(1, 'Pilih jam tutup'),
  classificationPrice: z.string().min(1, 'Pilih klasifikasi harga'),
});

type MerchantFormData = z.infer<typeof merchantSchema>;

const timeOptions = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
];

const priceClassifications = [
  { value: 'MURAH', label: 'Murah (< Rp 25.000)' },
  { value: 'SEDANG', label: 'Sedang (Rp 25.000 - Rp 75.000)' },
  { value: 'MAHAL', label: 'Premium (> Rp 75.000)' },
];

export default function RegisterMerchantPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(true);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantSchema),
  });

  useEffect(() => {
    async function loadVillages() {
      try {
        const { data, error } = await supabase
          .from('villages')
          .select('*')
          .eq('is_active', true)
          .eq('registration_status', 'APPROVED')
          .order('name');
        
        if (error) throw error;
        
        setVillages(data?.map(v => ({
          id: v.id,
          name: v.name,
          district: v.district,
          regency: v.regency,
          description: v.description || '',
          image: v.image_url || '',
          isActive: v.is_active,
        })) || []);
      } catch (error) {
        console.error('Error loading villages:', error);
      } finally {
        setLoadingVillages(false);
      }
    }
    loadVillages();
  }, []);

  const onSubmit = async (data: MerchantFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('merchants').insert({
        name: data.name.trim(),
        village_id: data.villageId,
        address: data.address.trim(),
        phone: data.phone.trim(),
        open_time: data.openTime,
        close_time: data.closeTime,
        classification_price: data.classificationPrice,
        registration_status: 'PENDING',
        status: 'PENDING',
        order_mode: 'ADMIN_ASSISTED',
        is_open: false,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Pendaftaran pedagang berhasil dikirim!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Gagal mendaftar pedagang');
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
              Pendaftaran usaha Anda sedang dalam proses verifikasi oleh Tim Verifikator. 
              Kami akan menghubungi Anda melalui telepon setelah disetujui.
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
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Store className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Daftarkan Usaha</h1>
                <p className="text-xs text-muted-foreground">
                  Bergabung sebagai Pedagang UMKM
                </p>
              </div>
            </div>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6"
          >
            <p className="text-xs text-foreground">
              <strong>Proses Verifikasi:</strong> Pendaftaran akan diverifikasi oleh Tim Verifikator dalam 1-3 hari kerja. 
              Pastikan usaha Anda berada di wilayah desa wisata yang terdaftar.
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
            {/* Business Info Section */}
            <div className="space-y-4">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Informasi Usaha
              </h2>

              <div>
                <Label htmlFor="name" className="text-xs">Nama Usaha/Toko *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Warung Bu Siti"
                  {...register('name')}
                  className="mt-1.5"
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="villageId" className="text-xs">Desa Wisata *</Label>
                <Select onValueChange={(value) => setValue('villageId', value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={loadingVillages ? "Memuat..." : "Pilih desa wisata"} />
                  </SelectTrigger>
                  <SelectContent>
                    {villages.map((village) => (
                      <SelectItem key={village.id} value={village.id}>
                        {village.name} - {village.district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.villageId && (
                  <p className="text-destructive text-xs mt-1">{errors.villageId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address" className="text-xs">Alamat Lengkap *</Label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Alamat lengkap usaha Anda"
                    {...register('address')}
                    className="pl-10"
                  />
                </div>
                {errors.address && (
                  <p className="text-destructive text-xs mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs">Nomor Telepon/WhatsApp *</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="08xxxxxxxxxx"
                    {...register('phone')}
                    className="pl-10"
                  />
                </div>
                {errors.phone && (
                  <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Operating Hours Section */}
            <div className="space-y-4 pt-2">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Jam Operasional
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="openTime" className="text-xs">Jam Buka *</Label>
                  <Select onValueChange={(value) => setValue('openTime', value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Pilih jam" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.openTime && (
                    <p className="text-destructive text-xs mt-1">{errors.openTime.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="closeTime" className="text-xs">Jam Tutup *</Label>
                  <Select onValueChange={(value) => setValue('closeTime', value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Pilih jam" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.closeTime && (
                    <p className="text-destructive text-xs mt-1">{errors.closeTime.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Price Classification Section */}
            <div className="space-y-4 pt-2">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Klasifikasi Harga
              </h2>

              <div>
                <Label htmlFor="classificationPrice" className="text-xs">Rentang Harga Produk *</Label>
                <Select onValueChange={(value) => setValue('classificationPrice', value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Pilih klasifikasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceClassifications.map((classification) => (
                      <SelectItem key={classification.value} value={classification.value}>
                        {classification.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classificationPrice && (
                  <p className="text-destructive text-xs mt-1">{errors.classificationPrice.message}</p>
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
