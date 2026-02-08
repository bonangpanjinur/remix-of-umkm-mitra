import { useState, useEffect } from 'react';
import { Save, Loader2, Receipt, FileText } from 'lucide-react';
import { MerchantLayout } from '@/components/merchant/MerchantLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function MerchantPOSSettingsPage() {
  const { user } = useAuth();
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    invoice_header: '',
    invoice_footer: 'Terima kasih atas kunjungan Anda!',
    show_logo: true,
    show_address: true,
    show_phone: true,
    paper_size: '58mm',
    font_size: 'normal',
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!merchant) { setLoading(false); return; }
      setMerchantId(merchant.id);

      const { data: settings } = await supabase
        .from('pos_settings')
        .select('*')
        .eq('merchant_id', merchant.id)
        .maybeSingle();

      if (settings) {
        setForm({
          invoice_header: settings.invoice_header || '',
          invoice_footer: settings.invoice_footer || '',
          show_logo: settings.show_logo,
          show_address: settings.show_address,
          show_phone: settings.show_phone,
          paper_size: settings.paper_size,
          font_size: settings.font_size,
        });
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!merchantId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pos_settings')
        .upsert({
          merchant_id: merchantId,
          ...form,
        }, { onConflict: 'merchant_id' });

      if (error) throw error;
      toast.success('Pengaturan kasir berhasil disimpan');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MerchantLayout title="Pengaturan Kasir" subtitle="Kustomisasi struk dan tampilan kasir">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Pengaturan Kasir" subtitle="Kustomisasi struk dan tampilan kasir">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Desain Struk / Faktur
            </CardTitle>
            <CardDescription>Atur tampilan struk yang dicetak dari kasir POS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Header Struk (opsional)</Label>
              <Textarea
                value={form.invoice_header}
                onChange={e => setForm(prev => ({ ...prev, invoice_header: e.target.value }))}
                placeholder="Teks di atas nama toko, misal: Selamat Datang!"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Footer Struk</Label>
              <Textarea
                value={form.invoice_footer}
                onChange={e => setForm(prev => ({ ...prev, invoice_footer: e.target.value }))}
                placeholder="Teks di bawah struk"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ukuran Kertas</Label>
                <Select value={form.paper_size} onValueChange={v => setForm(prev => ({ ...prev, paper_size: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm (Thermal)</SelectItem>
                    <SelectItem value="80mm">80mm (Thermal)</SelectItem>
                    <SelectItem value="A4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ukuran Font</Label>
                <Select value={form.font_size} onValueChange={v => setForm(prev => ({ ...prev, font_size: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Kecil</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Besar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Tampilkan Alamat</p>
                  <p className="text-xs text-muted-foreground">Alamat toko di struk</p>
                </div>
                <Switch
                  checked={form.show_address}
                  onCheckedChange={v => setForm(prev => ({ ...prev, show_address: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Tampilkan Telepon</p>
                  <p className="text-xs text-muted-foreground">Nomor telepon di struk</p>
                </div>
                <Switch
                  checked={form.show_phone}
                  onCheckedChange={v => setForm(prev => ({ ...prev, show_phone: v }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Simpan Pengaturan
        </Button>
      </div>
    </MerchantLayout>
  );
}
