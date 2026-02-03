import { useState, useEffect } from 'react';
import { Settings, Plus, Save, Trash2, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QuotaTier, fetchQuotaTiers } from '@/lib/quotaApi';

export default function AdminQuotaSettingsPage() {
  const [tiers, setTiers] = useState<QuotaTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    const data = await fetchQuotaTiers();
    setTiers(data);
    setLoading(false);
  };

  const handleAddTier = () => {
    const newTier: QuotaTier = {
      id: crypto.randomUUID(),
      min_price: 0,
      max_price: null,
      credit_cost: 1
    };
    setTiers([...tiers, newTier]);
  };

  const handleRemoveTier = (id: string) => {
    setTiers(tiers.filter(t => t.id !== id));
  };

  const handleUpdateTier = (id: string, field: keyof QuotaTier, value: any) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing tiers
      const { error: deleteError } = await supabase
        .from('quota_tiers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert new tiers
      const tiersToInsert = tiers.map(({ id, ...rest }) => ({
        ...rest,
        min_price: Number(rest.min_price),
        max_price: rest.max_price === null ? null : Number(rest.max_price),
        credit_cost: Number(rest.credit_cost)
      }));

      if (tiersToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('quota_tiers')
          .insert(tiersToInsert);

        if (insertError) throw insertError;
      }

      toast.success('Pengaturan kuota berhasil disimpan');
      loadTiers();
    } catch (error) {
      console.error('Error saving tiers:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Pengaturan Kuota" subtitle="Kelola biaya kuota transaksi berdasarkan harga produk secara dinamis">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tier Biaya Kuota</CardTitle>
                <CardDescription>
                  Tentukan berapa banyak kuota yang dihabiskan untuk setiap rentang harga produk.
                </CardDescription>
              </div>
              <Button onClick={handleAddTier} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground pb-2 border-b">
                <div className="col-span-4">Harga Minimum (Rp)</div>
                <div className="col-span-4">Harga Maksimum (Rp)</div>
                <div className="col-span-3">Biaya Kuota</div>
                <div className="col-span-1"></div>
              </div>

              {tiers.map((tier) => (
                <div key={tier.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <Input
                      type="number"
                      value={tier.min_price}
                      onChange={(e) => handleUpdateTier(tier.id, 'min_price', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      placeholder="Tanpa Batas"
                      value={tier.max_price === null ? '' : tier.max_price}
                      onChange={(e) => handleUpdateTier(tier.id, 'max_price', e.target.value === '' ? null : e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={tier.credit_cost}
                      onChange={(e) => handleUpdateTier(tier.id, 'credit_cost', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemoveTier(tier.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {tiers.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada tier yang diatur. Klik "Tambah Tier" untuk memulai.
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertCircle className="h-4 w-4" />
                <span>Pastikan rentang harga tidak tumpang tindih.</span>
              </div>
              <Button onClick={handleSave} disabled={saving || loading}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contoh Logika</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Harga produk 0 - 3000: Menghabiskan 1 kuota</p>
            <p>• Harga produk 3001 - 5000: Menghabiskan 1 kuota</p>
            <p>• Harga produk 5001 - 10000: Menghabiskan 2 kuota</p>
            <p>• Harga produk &gt; 10000: Menghabiskan 3 kuota</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
