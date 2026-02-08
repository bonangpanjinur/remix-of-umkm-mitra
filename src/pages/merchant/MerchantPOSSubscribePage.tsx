import { useState, useEffect } from 'react';
import { CreditCard, Check, Clock, Upload, Loader2, AlertTriangle, Gift } from 'lucide-react';
import { MerchantLayout } from '@/components/merchant/MerchantLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { getSettingByKey } from '@/lib/adminApi';

interface POSPackage {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  price: number;
  is_active: boolean;
}

export default function MerchantPOSSubscribePage() {
  const { user } = useAuth();
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [packages, setPackages] = useState<POSPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingSub, setExistingSub] = useState<any>(null);
  const [trialDays, setTrialDays] = useState(30);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!merchant) { setLoading(false); return; }
        setMerchantId(merchant.id);

        // Load packages
        const { data: pkgs } = await supabase
          .from('pos_packages')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        setPackages(pkgs || []);

        // Check existing subscription
        const { data: sub } = await supabase
          .from('pos_subscriptions')
          .select('*')
          .eq('merchant_id', merchant.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setExistingSub(sub);

        // Check if trial was used
        const { count } = await supabase
          .from('pos_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchant.id)
          .eq('is_trial', true);
        setHasUsedTrial((count || 0) > 0);

        // Get trial days config
        const config = await getSettingByKey('pos_config');
        if (config?.value) {
          setTrialDays((config.value as any).trial_days || 30);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleActivateTrial = async () => {
    if (!merchantId) return;
    setSubmitting(true);
    try {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setDate(expiry.getDate() + trialDays);

      const { error } = await supabase.from('pos_subscriptions').insert({
        merchant_id: merchantId,
        status: 'ACTIVE',
        is_trial: true,
        payment_amount: 0,
        payment_status: 'FREE',
        started_at: now.toISOString(),
        expired_at: expiry.toISOString(),
      });
      if (error) throw error;
      toast.success(`Trial ${trialDays} hari berhasil diaktifkan!`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengaktifkan trial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscribe = async () => {
    if (!merchantId || !selectedPkg) return;
    const pkg = packages.find(p => p.id === selectedPkg);
    if (!pkg) return;

    if (pkg.price > 0 && !paymentProof) {
      toast.error('Silakan upload bukti pembayaran');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + pkg.duration_months);

      const { error } = await supabase.from('pos_subscriptions').insert({
        merchant_id: merchantId,
        package_id: pkg.id,
        status: 'PENDING',
        payment_amount: pkg.price,
        payment_proof_url: paymentProof,
        payment_status: pkg.price === 0 ? 'FREE' : 'PENDING',
        started_at: now.toISOString(),
        expired_at: expiry.toISOString(),
      });
      if (error) throw error;
      toast.success('Permintaan berhasil dikirim! Menunggu persetujuan admin.');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim permintaan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MerchantLayout title="Langganan Kasir POS" subtitle="Pilih paket kasir">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MerchantLayout>
    );
  }

  // Already has pending/active subscription
  if (existingSub) {
    const isActive = existingSub.status === 'ACTIVE' && new Date(existingSub.expired_at) > new Date();
    const isPending = existingSub.status === 'PENDING';

    return (
      <MerchantLayout title="Langganan Kasir POS" subtitle="Status langganan kasir">
        <div className="max-w-lg mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isActive ? <Check className="h-5 w-5 text-success" /> : isPending ? <Clock className="h-5 w-5 text-warning" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
                {isActive ? 'Kasir POS Aktif' : isPending ? 'Menunggu Persetujuan' : 'Langganan Tidak Aktif'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={isActive ? 'success' : isPending ? 'warning' : 'destructive'}>
                  {existingSub.status}
                </Badge>
              </div>
              {existingSub.is_trial && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipe</span>
                  <Badge variant="info">Trial Gratis</Badge>
                </div>
              )}
              {existingSub.expired_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Berlaku hingga</span>
                  <span>{new Date(existingSub.expired_at).toLocaleDateString('id-ID')}</span>
                </div>
              )}
              {existingSub.rejection_reason && (
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <p className="text-sm text-destructive">Alasan ditolak: {existingSub.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Langganan Kasir POS" subtitle="Pilih paket kasir">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Free Trial */}
        {!hasUsedTrial && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Coba Gratis {trialDays} Hari!
              </CardTitle>
              <CardDescription>
                Coba fitur kasir POS selama {trialDays} hari tanpa biaya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleActivateTrial} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />}
                Aktifkan Trial Gratis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Packages */}
        <h3 className="font-bold text-lg">Paket Berlangganan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map(pkg => (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all ${selectedPkg === pkg.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/30'}`}
              onClick={() => setSelectedPkg(pkg.id)}
            >
              <CardContent className="p-4 space-y-2">
                <h4 className="font-bold">{pkg.name}</h4>
                {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                <p className="text-2xl font-bold text-primary">{formatPrice(pkg.price)}</p>
                <p className="text-xs text-muted-foreground">{pkg.duration_months} bulan</p>
                {selectedPkg === pkg.id && (
                  <Badge variant="default"><Check className="h-3 w-3 mr-1" /> Dipilih</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <p>Belum ada paket tersedia. Hubungi admin.</p>
          </div>
        )}

        {/* Payment Proof */}
        {selectedPkg && (packages.find(p => p.id === selectedPkg)?.price || 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" /> Bukti Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={paymentProof}
                onChange={setPaymentProof}
                bucket="payment-proofs"
                path={`pos/${merchantId}`}
                placeholder="Upload bukti pembayaran"
              />
            </CardContent>
          </Card>
        )}

        {selectedPkg && (
          <Button onClick={handleSubscribe} disabled={submitting} className="w-full" size="lg">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
            Kirim Permintaan Langganan
          </Button>
        )}
      </div>
    </MerchantLayout>
  );
}
