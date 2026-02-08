import { useState, useEffect } from 'react';
import { Receipt, Check, X, Eye, Package, Plus, Trash2, Save, Loader2, Settings, Clock, CreditCard } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { getSettingByKey, updateAppSetting } from '@/lib/adminApi';

interface POSPackage {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  price: number;
  is_active: boolean;
  sort_order: number;
}

interface POSSubscription {
  id: string;
  merchant_id: string;
  merchant_name?: string;
  package_name?: string;
  status: string;
  payment_amount: number;
  payment_proof_url: string | null;
  payment_status: string;
  started_at: string | null;
  expired_at: string | null;
  is_trial: boolean;
  rejection_reason: string | null;
  created_at: string;
}

export default function AdminPOSPage() {
  const [packages, setPackages] = useState<POSPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<POSSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialDays, setTrialDays] = useState(30);
  const [savingConfig, setSavingConfig] = useState(false);
  const [addPkgOpen, setAddPkgOpen] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: '', description: '', duration_months: 1, price: 0 });
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectSubId, setRejectSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pkgsRes, subsRes, config] = await Promise.all([
        supabase.from('pos_packages').select('*').order('sort_order'),
        supabase.from('pos_subscriptions').select('*, merchants(name), pos_packages(name)').order('created_at', { ascending: false }),
        getSettingByKey('pos_config'),
      ]);

      setPackages(pkgsRes.data || []);
      setSubscriptions((subsRes.data || []).map((s: any) => ({
        ...s,
        merchant_name: s.merchants?.name || '-',
        package_name: s.pos_packages?.name || (s.is_trial ? 'Trial Gratis' : '-'),
      })));
      if (config?.value) {
        setTrialDays((config.value as any).trial_days || 30);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    const ok = await updateAppSetting('pos_config', { trial_days: trialDays, is_enabled: true });
    if (ok) toast.success('Konfigurasi POS berhasil disimpan');
    else toast.error('Gagal menyimpan');
    setSavingConfig(false);
  };

  const handleAddPackage = async () => {
    const { error } = await supabase.from('pos_packages').insert({
      name: newPkg.name,
      description: newPkg.description || null,
      duration_months: newPkg.duration_months,
      price: newPkg.price,
      sort_order: packages.length,
    });
    if (error) { toast.error('Gagal menambah paket'); return; }
    toast.success('Paket berhasil ditambahkan');
    setAddPkgOpen(false);
    setNewPkg({ name: '', description: '', duration_months: 1, price: 0 });
    loadData();
  };

  const handleDeletePackage = async (id: string) => {
    const { error } = await supabase.from('pos_packages').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus paket'); return; }
    toast.success('Paket dihapus');
    loadData();
  };

  const handleApproveSub = async (id: string) => {
    const { error } = await supabase.from('pos_subscriptions').update({
      status: 'ACTIVE',
      payment_status: 'PAID',
      approved_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast.error('Gagal menyetujui'); return; }
    toast.success('Langganan disetujui');
    loadData();
  };

  const handleRejectSub = async () => {
    if (!rejectSubId) return;
    const { error } = await supabase.from('pos_subscriptions').update({
      status: 'REJECTED',
      rejection_reason: rejectReason,
    }).eq('id', rejectSubId);
    if (error) { toast.error('Gagal menolak'); return; }
    toast.success('Langganan ditolak');
    setRejectDialogOpen(false);
    setRejectSubId(null);
    setRejectReason('');
    loadData();
  };

  const pendingCount = subscriptions.filter(s => s.status === 'PENDING').length;

  return (
    <AdminLayout title="Manajemen Kasir POS" subtitle="Kelola paket, langganan, dan konfigurasi kasir">
      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            Permintaan {pendingCount > 0 && <Badge variant="destructive" className="text-[10px] px-1.5">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="packages">Paket Harga</TabsTrigger>
          <TabsTrigger value="config">Konfigurasi</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Permintaan Langganan Kasir</CardTitle>
              <CardDescription>Kelola permintaan pengaktifan fitur kasir dari merchant</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Bukti</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map(sub => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.merchant_name}</TableCell>
                          <TableCell>
                            {sub.is_trial ? <Badge variant="info">Trial</Badge> : sub.package_name}
                          </TableCell>
                          <TableCell>{formatPrice(sub.payment_amount)}</TableCell>
                          <TableCell>
                            <Badge variant={sub.status === 'ACTIVE' ? 'success' : sub.status === 'PENDING' ? 'warning' : 'destructive'}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.payment_proof_url ? (
                              <Button variant="ghost" size="sm" onClick={() => setViewProofUrl(sub.payment_proof_url)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(sub.created_at).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right">
                            {sub.status === 'PENDING' && (
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" onClick={() => handleApproveSub(sub.id)}>
                                  <Check className="h-3 w-3 mr-1" /> Setuju
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => {
                                  setRejectSubId(sub.id);
                                  setRejectDialogOpen(true);
                                }}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {subscriptions.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Belum ada permintaan</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Paket Harga Kasir</CardTitle>
                <CardDescription>Atur paket langganan kasir POS</CardDescription>
              </div>
              <Button onClick={() => setAddPkgOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Paket
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map(pkg => (
                  <Card key={pkg.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold">{pkg.name}</h4>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePackage(pkg.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                      <p className="text-2xl font-bold text-primary">{formatPrice(pkg.price)}</p>
                      <p className="text-xs text-muted-foreground">{pkg.duration_months} bulan</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Konfigurasi POS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Masa Trial Gratis (hari)</Label>
                <Input
                  type="number"
                  value={trialDays}
                  onChange={e => setTrialDays(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Merchant akan mendapatkan akses gratis selama {trialDays} hari</p>
              </div>
              <Button onClick={handleSaveConfig} disabled={savingConfig}>
                {savingConfig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan Konfigurasi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Package Dialog */}
      <Dialog open={addPkgOpen} onOpenChange={setAddPkgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Paket POS</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Paket</Label>
              <Input value={newPkg.name} onChange={e => setNewPkg(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Paket 1 Bulan" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={newPkg.description} onChange={e => setNewPkg(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi paket" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durasi (bulan)</Label>
                <Input type="number" value={newPkg.duration_months} onChange={e => setNewPkg(p => ({ ...p, duration_months: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-2">
                <Label>Harga (Rp)</Label>
                <Input type="number" value={newPkg.price} onChange={e => setNewPkg(p => ({ ...p, price: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPkgOpen(false)}>Batal</Button>
            <Button onClick={handleAddPackage} disabled={!newPkg.name}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Proof Dialog */}
      <Dialog open={!!viewProofUrl} onOpenChange={() => setViewProofUrl(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bukti Pembayaran</DialogTitle></DialogHeader>
          {viewProofUrl && (
            <img src={viewProofUrl} alt="Bukti" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tolak Permintaan</DialogTitle></DialogHeader>
          <div className="py-4">
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Alasan penolakan..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleRejectSub} disabled={!rejectReason.trim()}>Tolak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
