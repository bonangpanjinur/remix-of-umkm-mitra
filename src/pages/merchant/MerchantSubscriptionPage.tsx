import { useState, useEffect } from 'react';
import { Package, CreditCard, AlertTriangle, Clock, TrendingUp, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { MerchantLayout } from '@/components/merchant/MerchantLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

interface Subscription {
  id: string;
  transaction_quota: number;
  used_quota: number;
  started_at: string;
  expired_at: string;
  status: string;
  payment_status: string;
  payment_amount: number;
  payment_proof_url?: string;
  admin_notes?: string;
  package: {
    name: string;
    price_per_transaction: number;
    transaction_quota: number;
    validity_days: number;
    group_commission_percent: number;
  };
}

interface TransactionPackage {
  id: string;
  name: string;
  price_per_transaction: number;
  group_commission_percent: number;
  transaction_quota: number;
  validity_days: number;
  description: string | null;
}

interface PaymentSettings {
  bank_name: string;
  account_number: string;
  account_name: string;
  qris_url: string;
}

export default function MerchantSubscriptionPage() {
  const { user } = useAuth();
  const [merchant, setMerchant] = useState<{ id: string } | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [availablePackages, setAvailablePackages] = useState<TransactionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TransactionPackage | null>(null);
  const [pendingSubscription, setPendingSubscription] = useState<Subscription | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get merchant
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!merchantData) {
        setLoading(false);
        return;
      }

      setMerchant(merchantData);

      // Get current active subscription
      const { data: subData } = await supabase
        .from('merchant_subscriptions')
        .select(`
          *,
          package:transaction_packages(name, price_per_transaction, transaction_quota, validity_days, group_commission_percent)
        `)
        .eq('merchant_id', merchantData.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      // Filter out expired ones in memory if validity_days > 0
      const now = new Date();
      const activeSub = subData?.find(s => {
        const pkg = s.package as any;
        if (pkg.validity_days === 0) return true;
        return new Date(s.expired_at) > now;
      });

      if (activeSub) {
        setCurrentSubscription({
          ...activeSub,
          package: activeSub.package as Subscription['package'],
        });
      }

      // Get subscription history
      const { data: historyData } = await supabase
        .from('merchant_subscriptions')
        .select(`
          *,
          package:transaction_packages(name, price_per_transaction, transaction_quota, validity_days, group_commission_percent)
        `)
        .eq('merchant_id', merchantData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setSubscriptionHistory(
        (historyData || []).map((s) => ({
          ...s,
          package: s.package as Subscription['package'],
        }))
      );

      // Get available packages
      const { data: packagesData } = await supabase
        .from('transaction_packages')
        .select('*')
        .eq('is_active', true)
        .order('price_per_transaction', { ascending: true });
        
      setAvailablePackages((packagesData || []) as TransactionPackage[]);

      // Get payment settings
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'payment_settings')
        .maybeSingle();
      
      if (settingsData) {
        setPaymentSettings(settingsData.value as PaymentSettings);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleBuyPackage = async () => {
    if (!selectedPackage || !merchant) return;

    setPurchasing(true);
    try {
      let expiredAt = null;
      if (selectedPackage.validity_days > 0) {
        const date = new Date();
        date.setDate(date.getDate() + selectedPackage.validity_days);
        expiredAt = date.toISOString();
      } else {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 100);
        expiredAt = date.toISOString();
      }

      const { data, error } = await supabase.from('merchant_subscriptions').insert({
        merchant_id: merchant.id,
        package_id: selectedPackage.id,
        transaction_quota: selectedPackage.transaction_quota,
        used_quota: 0,
        expired_at: expiredAt,
        status: 'INACTIVE', // Inactive until paid and approved
        payment_status: 'UNPAID',
        payment_amount: selectedPackage.price_per_transaction, // Fixed: use package price directly
      }).select(`
        *,
        package:transaction_packages(name, price_per_transaction, transaction_quota, validity_days, group_commission_percent)
      `).single();

      if (error) throw error;

      toast.success('Permintaan pembelian berhasil dibuat. Silakan lakukan pembayaran.');
      setBuyDialogOpen(false);
      setPendingSubscription(data as any);
      setPaymentDialogOpen(true);
      fetchData();
    } catch (error) {
      console.error('Error purchasing package:', error);
      toast.error('Gagal membuat permintaan pembelian');
    } finally {
      setPurchasing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, subId: string) => {
    const file = event.target.files?.[0];
    if (!file || !merchant) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${merchant.id}/${subId}-${Math.random()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('merchants')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('merchants')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('merchant_subscriptions')
        .update({ 
          payment_proof_url: publicUrl,
          payment_status: 'PENDING_APPROVAL'
        })
        .eq('id', subId);

      if (updateError) throw updateError;

      toast.success('Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.');
      setPaymentDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Gagal mengunggah bukti pembayaran');
    } finally {
      setUploading(false);
    }
  };

  const getRemainingDaysText = (sub: Subscription) => {
    if (sub.package.validity_days === 0) return 'Selamanya';
    
    const now = new Date();
    const exp = new Date(sub.expired_at);
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${Math.max(0, diff)} hari`;
  };

  const getQuotaPercentage = (used: number, total: number) => {
    if (total === 0) return 100;
    return Math.min(100, (used / total) * 100);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-700">Lunas</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge className="bg-yellow-100 text-yellow-700">Menunggu Verifikasi</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Belum Bayar</Badge>;
    }
  };

  if (loading) {
    return (
      <MerchantLayout title="Kuota Transaksi" subtitle="Kelola paket kuota transaksi Anda">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Kuota Transaksi" subtitle="Kelola paket kuota transaksi Anda">
      {/* Current Subscription Status */}
      {currentSubscription ? (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {currentSubscription.package.name}
                </CardTitle>
                <CardDescription>Paket aktif saat ini</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700">Aktif</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quota Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Kuota Transaksi</span>
                  <span className="font-medium">
                    {currentSubscription.used_quota} / {currentSubscription.transaction_quota}
                  </span>
                </div>
                <Progress 
                  value={getQuotaPercentage(currentSubscription.used_quota, currentSubscription.transaction_quota)} 
                  className="h-3"
                />
                {currentSubscription.used_quota >= currentSubscription.transaction_quota && (
                  <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Kuota habis! Beli paket baru untuk melanjutkan transaksi.
                  </p>
                )}
              </div>

              {/* Remaining Days */}
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Sisa Masa Aktif</span>
                </div>
                <span className="font-semibold text-primary">
                  {getRemainingDaysText(currentSubscription)}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-muted-foreground">Tersisa</p>
                  <p className="font-bold text-xl text-primary">
                    {currentSubscription.transaction_quota - currentSubscription.used_quota}
                  </p>
                  <p className="text-xs text-muted-foreground">transaksi</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-muted-foreground">Komisi Kelompok</p>
                  <p className="font-bold text-xl">
                    {currentSubscription.package.group_commission_percent}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Tidak Ada Kuota Aktif</h3>
                <p className="text-sm text-muted-foreground">
                  Anda tidak dapat menerima pesanan tanpa kuota aktif. Silakan beli paket di bawah.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Packages */}
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Pilih Paket Kuota
      </h3>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {availablePackages.map((pkg) => (
          <Card key={pkg.id} className="relative overflow-hidden border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription>{pkg.transaction_quota} Kredit Transaksi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-3xl font-bold text-primary">{formatPrice(pkg.price_per_transaction)}</span>
                <span className="text-muted-foreground text-sm ml-1">/ paket</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {pkg.transaction_quota} Total Kredit
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Masa aktif {pkg.validity_days === 0 ? 'Selamanya' : `${pkg.validity_days} hari`}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Komisi kelompok {pkg.group_commission_percent}%
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => {
                  setSelectedPackage(pkg);
                  setBuyDialogOpen(true);
                }}
              >
                Beli Paket
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription History */}
      <h3 className="font-bold text-lg mb-4">Riwayat Pembelian</h3>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Tanggal</th>
                <th className="text-left p-4 font-medium">Paket</th>
                <th className="text-left p-4 font-medium">Harga</th>
                <th className="text-left p-4 font-medium">Status Pembayaran</th>
                <th className="text-left p-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Belum ada riwayat pembelian.
                  </td>
                </tr>
              ) : (
                subscriptionHistory.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-0">
                    <td className="p-4">{new Date(sub.started_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 font-medium">{sub.package.name}</td>
                    <td className="p-4">{formatPrice(sub.payment_amount)}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {getPaymentStatusBadge(sub.payment_status)}
                        {sub.admin_notes && (
                          <span className="text-[10px] text-destructive italic">{sub.admin_notes}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {sub.payment_status === 'UNPAID' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setPendingSubscription(sub);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          Bayar Sekarang
                        </Button>
                      )}
                      {sub.payment_status === 'REJECTED' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-destructive"
                          onClick={() => {
                            setPendingSubscription(sub);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          Upload Ulang
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Buy Confirmation Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembelian</DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Anda akan membeli <strong>{selectedPackage.name}</strong> dengan rincian:
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Harga Paket</span>
                  <span className="font-bold">{formatPrice(selectedPackage.price_per_transaction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Kredit</span>
                  <span className="font-bold">{selectedPackage.transaction_quota} Kredit</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-bold">Total Pembayaran</span>
                  <span className="font-bold text-primary text-lg">{formatPrice(selectedPackage.price_per_transaction)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>Batal</Button>
            <Button onClick={handleBuyPackage} disabled={purchasing}>
              {purchasing ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Instructions & Upload Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Instruksi Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {paymentSettings ? (
              <>
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="text-center pb-2 border-b">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Transfer Bank</p>
                    <p className="font-bold text-lg">{paymentSettings.bank_name}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nomor Rekening</span>
                    <span className="font-mono font-bold">{paymentSettings.account_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nama Pemilik</span>
                    <span className="font-medium">{paymentSettings.account_name}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Jumlah Transfer</span>
                    <span className="font-bold text-primary">{pendingSubscription ? formatPrice(pendingSubscription.payment_amount) : '-'}</span>
                  </div>
                </div>

                {paymentSettings.qris_url && (
                  <div className="p-4 border rounded-lg text-center space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Atau Scan QRIS</p>
                    <img 
                      src={paymentSettings.qris_url} 
                      alt="QRIS" 
                      className="mx-auto w-48 h-48 object-contain border p-2 rounded"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground border rounded-lg">
                Memuat informasi pembayaran...
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="proof">Unggah Bukti Pembayaran</Label>
              <div className="flex items-center gap-4">
                <Input 
                  id="proof" 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => pendingSubscription && handleFileUpload(e, pendingSubscription.id)}
                  disabled={uploading}
                />
                {uploading && <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />}
              </div>
              <p className="text-[10px] text-muted-foreground">Format: JPG, PNG. Maksimal 2MB.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchantLayout>
  );
}
