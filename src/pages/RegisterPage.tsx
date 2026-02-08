import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, Store, Bike, ArrowRight, CheckCircle, Users, Shield } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { getSettingByKey } from '@/lib/adminApi';

export default function RegisterPage() {
  const [courierEnabled, setCourierEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkCourierRegistration() {
      try {
        const setting = await getSettingByKey('registration_courier');
        const enabled = (setting?.value as { enabled?: boolean })?.enabled ?? true;
        setCourierEnabled(enabled);
      } catch {
        setCourierEnabled(true);
      }
    }
    checkCourierRegistration();
  }, []);

  return (
    <div className="mobile-shell bg-background flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 py-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Bergabung Bersama Kami
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Daftarkan desa wisata, usaha UMKM, atau jadi kurir desa
            </p>
          </motion.div>

          {/* Registration Options */}
          <div className="space-y-4">
            {/* Village Registration Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                to="/register/village"
                className="block bg-card rounded-2xl border border-border p-5 hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition">
                    <Building className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-lg text-foreground">Desa Wisata</h2>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Daftarkan desa Anda sebagai destinasi wisata
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Promosi Gratis
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        <Shield className="h-3 w-3" />
                        Verifikasi Admin
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Merchant Registration Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to="/register/merchant"
                className="block bg-card rounded-2xl border border-border p-5 hover:border-accent/50 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition">
                    <Store className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-lg text-foreground">Pedagang UMKM</h2>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Jual produk lokal Anda kepada wisatawan
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Tanpa Biaya
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        <Shield className="h-3 w-3" />
                        Verifikasi Tim
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Courier Registration Card - Only show if enabled */}
            {courierEnabled && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  to="/register/courier"
                  className="block bg-card rounded-2xl border border-border p-5 hover:border-primary/50 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition">
                      <Bike className="h-7 w-7 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg text-foreground">Kurir/Ojek Desa</h2>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-destructive group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Antar pesanan dan bantu warga desa
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Penghasilan Harian
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                          <Shield className="h-3 w-3" />
                          Verifikasi Admin
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-2xl p-5"
          >
            <h3 className="font-semibold text-sm text-foreground mb-4">
              Keuntungan Bergabung
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-primary" />
                </div>
                <span className="text-muted-foreground">
                  Jangkau ribuan wisatawan potensial dari berbagai daerah
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-primary" />
                </div>
                <span className="text-muted-foreground">
                  Kelola pesanan dengan mudah melalui sistem terintegrasi
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-primary" />
                </div>
                <span className="text-muted-foreground">
                  Dukungan penuh dari tim DesaMart untuk pertumbuhan usaha
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Already have account */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Sudah punya akun pembeli?{' '}
              <Link to="/auth" className="text-primary font-medium hover:underline">
                Masuk di sini
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
