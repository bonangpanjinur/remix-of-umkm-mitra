import { useState, useEffect } from 'react';
import { Package, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { addDays } from 'date-fns';

interface TransactionPackage {
  id: string;
  name: string;
  classification_price: string;
  price_per_transaction: number;
  transaction_quota: number;
  validity_days: number;
  description: string | null;
  is_active: boolean;
}

interface CurrentSubscription {
  id: string;
  package_id: string;
  transaction_quota: number;
  used_quota: number;
  expired_at: string;
  status: string;
}

interface AssignPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  merchantName: string;
  classificationPrice: string | null;
  onSuccess: () => void;
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  'UNDER_5K': '≤ Rp 5.000',
  'FROM_5K_TO_10K': 'Rp 5.000 - 10.000',
  'FROM_10K_TO_20K': 'Rp 10.000 - 20.000',
  'ABOVE_20K': '> Rp 20.000',
};

export function AssignPackageDialog({
  open,
  onOpenChange,
  merchantId,
  merchantName,
  classificationPrice,
  onSuccess,
}: AssignPackageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<TransactionPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, merchantId, classificationPrice]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Fetch available packages (optionally filter by classification)
      let query = supabase
        .from('transaction_packages')
        .select('*')
        .eq('is_active', true)
        .order('transaction_quota', { ascending: true });

      // If merchant has classification, filter packages
      if (classificationPrice) {
        query = query.eq('classification_price', classificationPrice);
      }

      const { data: packagesData, error: packagesError } = await query;

      if (packagesError) throw packagesError;
      setPackages(packagesData || []);

      // Fetch current subscription
      const { data: subData, error: subError } = await supabase
        .from('merchant_subscriptions')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subError && subData) {
        setCurrentSubscription(subData);
      } else {
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPackageId) {
      toast.error('Pilih paket terlebih dahulu');
      return;
    }

    const selectedPkg = packages.find(p => p.id === selectedPackageId);
    if (!selectedPkg) return;

    setLoading(true);
    try {
      const startDate = new Date();
      const expiredAt = addDays(startDate, selectedPkg.validity_days);

      // Create new subscription
      const { data: newSub, error: subError } = await supabase
        .from('merchant_subscriptions')
        .insert({
          merchant_id: merchantId,
          package_id: selectedPackageId,
          transaction_quota: selectedPkg.transaction_quota,
          used_quota: 0,
          started_at: startDate.toISOString(),
          expired_at: expiredAt.toISOString(),
          status: 'ACTIVE',
          payment_status: 'PAID', // Admin assigns directly = already paid
          payment_amount: selectedPkg.price_per_transaction * selectedPkg.transaction_quota,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (subError) throw subError;

      // Update merchant's current subscription
      const { error: merchantError } = await supabase
        .from('merchants')
        .update({
          current_subscription_id: newSub.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', merchantId);

      if (merchantError) throw merchantError;

      // If there was a previous active subscription, mark it as replaced
      if (currentSubscription) {
        await supabase
          .from('merchant_subscriptions')
          .update({ status: 'REPLACED' })
          .eq('id', currentSubscription.id);
      }

      toast.success(`Paket "${selectedPkg.name}" berhasil ditambahkan ke ${merchantName}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning package:', error);
      toast.error('Gagal menambahkan paket');
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Tambah Paket Transaksi
          </DialogTitle>
          <DialogDescription>
            Tambahkan paket kuota transaksi untuk <strong>{merchantName}</strong>
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Current subscription info */}
            {currentSubscription && (
              <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
                <p className="text-sm font-medium text-info mb-1">Paket Aktif Saat Ini</p>
                <p className="text-sm text-muted-foreground">
                  Sisa kuota: {currentSubscription.transaction_quota - currentSubscription.used_quota} transaksi
                </p>
                <p className="text-xs text-muted-foreground">
                  Berakhir: {new Date(currentSubscription.expired_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            )}

            {/* Classification info */}
            {classificationPrice && (
              <div className="text-sm text-muted-foreground">
                Klasifikasi harga: <Badge variant="outline">{CLASSIFICATION_LABELS[classificationPrice] || classificationPrice}</Badge>
              </div>
            )}

            {/* Package selection */}
            {packages.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Tidak ada paket tersedia untuk klasifikasi ini</p>
              </div>
            ) : (
              <RadioGroup value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <Label className="text-sm font-medium">Pilih Paket</Label>
                <div className="space-y-2 mt-2">
                  {packages.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPackageId === pkg.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={pkg.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{pkg.name}</p>
                          <Badge variant="secondary">{pkg.transaction_quota} transaksi</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatPrice(pkg.price_per_transaction)}/transaksi • {pkg.validity_days} hari
                        </p>
                        {pkg.description && (
                          <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            )}

            {/* Summary */}
            {selectedPackage && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm font-medium text-success flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  Ringkasan
                </p>
                <div className="text-sm mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Paket</span>
                    <span className="font-medium">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kuota</span>
                    <span>{selectedPackage.transaction_quota} transaksi</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Masa Aktif</span>
                    <span>{selectedPackage.validity_days} hari</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total Nilai</span>
                    <span>{formatPrice(selectedPackage.price_per_transaction * selectedPackage.transaction_quota)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedPackageId || loadingData}>
            {loading ? 'Memproses...' : 'Tambahkan Paket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
