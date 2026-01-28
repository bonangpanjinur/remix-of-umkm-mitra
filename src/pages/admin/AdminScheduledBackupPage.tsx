import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Clock, Database, Loader2, Play, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface BackupSchedule {
  id: string;
  name: string;
  schedule_type: string;
  schedule_time: string;
  schedule_day: number | null;
  tables_included: string[];
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

const AVAILABLE_TABLES = [
  { id: 'merchants', label: 'Merchants' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'order_items', label: 'Order Items' },
  { id: 'villages', label: 'Villages' },
  { id: 'tourism', label: 'Tourism' },
  { id: 'couriers', label: 'Couriers' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'reviews', label: 'Reviews' },
];

export default function AdminScheduledBackupPage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    schedule_type: 'daily',
    schedule_time: '02:00',
    schedule_day: 1,
    tables_included: ['merchants', 'products', 'orders', 'villages', 'tourism', 'couriers'],
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesRes, logsRes] = await Promise.all([
        supabase
          .from('backup_schedules')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('backup_logs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(10),
      ]);

      setSchedules(schedulesRes.data || []);
      setBackupLogs(logsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (schedule?: BackupSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setForm({
        name: schedule.name,
        schedule_type: schedule.schedule_type,
        schedule_time: schedule.schedule_time,
        schedule_day: schedule.schedule_day || 1,
        tables_included: schedule.tables_included || [],
        is_active: schedule.is_active,
      });
    } else {
      setEditingSchedule(null);
      setForm({
        name: '',
        schedule_type: 'daily',
        schedule_time: '02:00',
        schedule_day: 1,
        tables_included: ['merchants', 'products', 'orders', 'villages', 'tourism', 'couriers'],
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const calculateNextRun = (scheduleType: string, scheduleTime: string, scheduleDay: number) => {
    const now = new Date();
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    if (scheduleType === 'daily') {
      if (next <= now) next.setDate(next.getDate() + 1);
    } else if (scheduleType === 'weekly') {
      const currentDay = now.getDay();
      let daysUntil = scheduleDay - currentDay;
      if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
        daysUntil += 7;
      }
      next.setDate(next.getDate() + daysUntil);
    } else if (scheduleType === 'monthly') {
      next.setDate(scheduleDay);
      if (next <= now) next.setMonth(next.getMonth() + 1);
    }

    return next.toISOString();
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        title: 'Error',
        description: 'Nama jadwal wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const nextRunAt = calculateNextRun(form.schedule_type, form.schedule_time, form.schedule_day);

      if (editingSchedule) {
        const { error } = await supabase
          .from('backup_schedules')
          .update({
            name: form.name,
            schedule_type: form.schedule_type,
            schedule_time: form.schedule_time,
            schedule_day: form.schedule_type !== 'daily' ? form.schedule_day : null,
            tables_included: form.tables_included,
            is_active: form.is_active,
            next_run_at: nextRunAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSchedule.id);

        if (error) throw error;
        toast({ title: 'Jadwal backup diperbarui' });
      } else {
        const { error } = await supabase
          .from('backup_schedules')
          .insert({
            name: form.name,
            schedule_type: form.schedule_type,
            schedule_time: form.schedule_time,
            schedule_day: form.schedule_type !== 'daily' ? form.schedule_day : null,
            tables_included: form.tables_included,
            is_active: form.is_active,
            next_run_at: nextRunAt,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
        toast({ title: 'Jadwal backup ditambahkan' });
      }

      setShowDialog(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan jadwal',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schedule: BackupSchedule) => {
    if (!confirm(`Hapus jadwal "${schedule.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('backup_schedules')
        .delete()
        .eq('id', schedule.id);

      if (error) throw error;
      toast({ title: 'Jadwal dihapus' });
      fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus jadwal',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (schedule: BackupSchedule) => {
    try {
      const { error } = await supabase
        .from('backup_schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleRunNow = async (schedule: BackupSchedule) => {
    toast({ title: 'Backup dimulai...', description: 'Proses backup sedang berjalan' });
    
    try {
      // Create backup log entry
      const { error } = await supabase
        .from('backup_logs')
        .insert({
          backup_type: 'scheduled',
          status: 'pending',
          tables_included: schedule.tables_included,
          started_at: new Date().toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      // Update last run
      await supabase
        .from('backup_schedules')
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: calculateNextRun(schedule.schedule_type, schedule.schedule_time, schedule.schedule_day || 1),
        })
        .eq('id', schedule.id);

      toast({ title: 'Backup berhasil dijalankan' });
      fetchData();
    } catch (error) {
      console.error('Error running backup:', error);
      toast({
        title: 'Error',
        description: 'Gagal menjalankan backup',
        variant: 'destructive',
      });
    }
  };

  const getScheduleLabel = (schedule: BackupSchedule) => {
    if (schedule.schedule_type === 'daily') {
      return `Setiap hari pukul ${schedule.schedule_time}`;
    } else if (schedule.schedule_type === 'weekly') {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return `Setiap ${days[schedule.schedule_day || 0]} pukul ${schedule.schedule_time}`;
    } else {
      return `Tanggal ${schedule.schedule_day} setiap bulan pukul ${schedule.schedule_time}`;
    }
  };

  return (
    <AdminLayout
      title="Backup Terjadwal"
      subtitle="Atur jadwal backup otomatis database"
    >
      <div className="space-y-6">
        {/* Schedules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Jadwal Backup
            </CardTitle>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada jadwal backup. Klik tombol di atas untuk menambahkan.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Tabel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Dijalankan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getScheduleLabel(schedule)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {schedule.tables_included?.length || 0} tabel
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={schedule.is_active}
                          onCheckedChange={() => handleToggleActive(schedule)}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {schedule.last_run_at
                          ? format(new Date(schedule.last_run_at), 'dd MMM yyyy HH:mm', { locale: id })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRunNow(schedule)}
                            title="Jalankan Sekarang"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(schedule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(schedule)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Backup Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Riwayat Backup Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {backupLogs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Belum ada riwayat backup</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tabel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {log.started_at
                          ? format(new Date(log.started_at), 'dd MMM yyyy HH:mm', { locale: id })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.backup_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.tables_included?.length || 0} tabel
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Edit Jadwal Backup' : 'Tambah Jadwal Backup'}
            </DialogTitle>
            <DialogDescription>
              Atur jadwal backup otomatis untuk database
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Jadwal *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Backup Harian"
              />
            </div>

            <div className="space-y-2">
              <Label>Frekuensi</Label>
              <Select
                value={form.schedule_type}
                onValueChange={(value) => setForm(prev => ({ ...prev, schedule_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.schedule_type === 'weekly' && (
              <div className="space-y-2">
                <Label>Hari</Label>
                <Select
                  value={form.schedule_day.toString()}
                  onValueChange={(value) => setForm(prev => ({ ...prev, schedule_day: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day, i) => (
                      <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.schedule_type === 'monthly' && (
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Select
                  value={form.schedule_day.toString()}
                  onValueChange={(value) => setForm(prev => ({ ...prev, schedule_day: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>Tanggal {day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Waktu</Label>
              <Input
                type="time"
                value={form.schedule_time}
                onChange={(e) => setForm(prev => ({ ...prev, schedule_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tabel yang di-backup</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {AVAILABLE_TABLES.map((table) => (
                  <div key={table.id} className="flex items-center gap-2">
                    <Checkbox
                      id={table.id}
                      checked={form.tables_included.includes(table.id)}
                      onCheckedChange={(checked) => {
                        setForm(prev => ({
                          ...prev,
                          tables_included: checked
                            ? [...prev.tables_included, table.id]
                            : prev.tables_included.filter(t => t !== table.id)
                        }));
                      }}
                    />
                    <label htmlFor={table.id} className="text-sm">{table.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : editingSchedule ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
