import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Store, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { locationService, Region } from "@/services/locationService";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Schema validasi form
const formSchema = z.object({
  shopName: z.string().min(3, "Nama toko minimal 3 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  province: z.string().min(1, "Provinsi wajib dipilih"),
  city: z.string().min(1, "Kota/Kabupaten wajib dipilih"),
  district: z.string().min(1, "Kecamatan wajib dipilih"),
  village: z.string().min(1, "Kelurahan wajib dipilih"),
  address: z.string().min(10, "Alamat lengkap wajib diisi"),
  phone: z.string().min(10, "Nomor telepon tidak valid"),
});

export default function SellerApplicationForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk data wilayah
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);

  // State loading untuk dropdown wilayah
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shopName: "",
      description: "",
      province: "",
      city: "",
      district: "",
      village: "",
      address: "",
      phone: "",
    },
  });

  // 1. Fetch Provinsi saat komponen di-mount
  useEffect(() => {
    const fetchProvincesData = async () => {
      setIsLoadingProvinces(true);
      try {
        const data = await locationService.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to fetch provinces", error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvincesData();
  }, []);

  // 2. Handler perubahan Provinsi -> Fetch Kota & Reset Dropdown Anak
  const handleProvinceChange = async (value: string) => {
    form.setValue("province", value);
    
    // Auto-reset field di bawahnya
    form.setValue("city", "");
    form.setValue("district", "");
    form.setValue("village", "");
    setCities([]);
    setDistricts([]);
    setVillages([]);

    if (value) {
      setIsLoadingCities(true);
      try {
        const data = await locationService.getRegencies(value);
        setCities(data);
      } catch (error) {
        console.error("Failed to fetch cities", error);
      } finally {
        setIsLoadingCities(false);
      }
    }
  };

  // 3. Handler perubahan Kota -> Fetch Kecamatan & Reset Dropdown Anak
  const handleCityChange = async (value: string) => {
    form.setValue("city", value);
    
    // Auto-reset field di bawahnya
    form.setValue("district", "");
    form.setValue("village", "");
    setDistricts([]);
    setVillages([]);

    if (value) {
      setIsLoadingDistricts(true);
      try {
        const data = await locationService.getDistricts(value);
        setDistricts(data);
      } catch (error) {
        console.error("Failed to fetch districts", error);
      } finally {
        setIsLoadingDistricts(false);
      }
    }
  };

  // 4. Handler perubahan Kecamatan -> Fetch Kelurahan & Reset Dropdown Anak
  const handleDistrictChange = async (value: string) => {
    form.setValue("district", value);
    
    // Auto-reset field di bawahnya
    form.setValue("village", "");
    setVillages([]);

    if (value) {
      setIsLoadingVillages(true);
      try {
        const data = await locationService.getVillages(value);
        setVillages(data);
      } catch (error) {
        console.error("Failed to fetch villages", error);
      } finally {
        setIsLoadingVillages(false);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: "Anda harus login terlebih dahulu",
        });
        return;
      }

      // Mendapatkan nama wilayah dari ID untuk disimpan
      const provinceName = locationService.getNameById(provinces, values.province);
      const cityName = locationService.getNameById(cities, values.city);
      const districtName = locationService.getNameById(districts, values.district);
      const villageName = locationService.getNameById(villages, values.village);

      // Simpan ke database
      const { error } = await supabase
        .from('merchants') 
        .insert({
          user_id: user.id,
          name: values.shopName,
          business_description: values.description,
          phone: values.phone,
          address_detail: values.address,
          province: provinceName,
          city: cityName,
          district: districtName,
          subdistrict: villageName,
          status: 'PENDING',
        });

      if (error) throw error;

      toast({
        title: "Pendaftaran Berhasil",
        description: "Aplikasi merchant Anda telah dikirim untuk ditinjau.",
      });
      
      navigate("/merchant/dashboard");

    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        variant: "destructive",
        title: "Gagal Mengirim",
        description: error.message || "Terjadi kesalahan saat menyimpan data",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 bg-white dark:bg-gray-950 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
      <div className="mb-10 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary rotate-3 hover:rotate-0 transition-transform">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Daftar Merchant Baru</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">Mulai kembangkan usaha Anda bersama kami</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Profil Usaha */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">1</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Profil Usaha</h3>
            </div>
            
            <FormField
              control={form.control}
              name="shopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Toko / Usaha</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Kedai Berkah Jaya" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Usaha</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ceritakan sedikit tentang produk atau layanan Anda..." 
                      className="resize-none h-28 focus-visible:ring-primary"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Minimal 10 karakter agar calon pelanggan mengenal usaha Anda.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor WhatsApp Aktif</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="081234567890" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent my-8"></div>

          {/* Section 2: Lokasi Operasional */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">2</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Lokasi Operasional</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provinsi</FormLabel>
                    <Select 
                      onValueChange={handleProvinceChange} 
                      value={field.value}
                      disabled={isLoadingProvinces}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          {isLoadingProvinces ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Memuat...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Pilih Provinsi" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinces.map((prov) => (
                          <SelectItem key={prov.code} value={prov.code}>
                            {prov.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kota / Kabupaten</FormLabel>
                    <Select 
                      onValueChange={handleCityChange} 
                      value={field.value}
                      disabled={isLoadingCities || !form.watch("province")}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          {isLoadingCities ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Memuat...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Pilih Kota" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.code} value={city.code}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kecamatan</FormLabel>
                    <Select 
                      onValueChange={handleDistrictChange} 
                      value={field.value}
                      disabled={isLoadingDistricts || !form.watch("city")}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          {isLoadingDistricts ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Memuat...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Pilih Kecamatan" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((dist) => (
                          <SelectItem key={dist.code} value={dist.code}>
                            {dist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="village"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelurahan / Desa</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoadingVillages || !form.watch("district")}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          {isLoadingVillages ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Memuat...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Pilih Kelurahan" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {villages.map((v) => (
                          <SelectItem key={v.code} value={v.code}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Lengkap</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Nama jalan, blok, nomor rumah, RT/RW..." 
                      className="resize-none h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-bold shadow-md hover:shadow-lg transition-all" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses Pendaftaran...
              </>
            ) : (
              "Daftar Sebagai Merchant"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
