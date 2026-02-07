import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Eye, Check, X, MoreHorizontal, Plus, Edit, Trash2, Image as ImageIcon, UserCheck } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { approveVillage, rejectVillage, deleteVillage } from '@/lib/adminApi';
import { VillageAddDialog } from '@/components/admin/VillageAddDialog';
import { VillageEditDialog } from '@/components/admin/VillageEditDialog';

interface VillageRow {
  id: string;
  name: string;
  regency: string;
  district: string;
  subdistrict: string | null;
  description: string | null;
  image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  registration_status: string;
  is_active: boolean;
  registered_at: string | null;
  owner_name: string | null;
  owner_phone: string | null;
}

export default function AdminVillagesPage() {
  const navigate = useNavigate();
  const [villages, setVillages] = useState<VillageRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState<VillageRow | null>(null);

  const fetchVillagesData = async () => {
    try {
      setLoading(true);
      // Fetch villages
      const { data: villagesData, error } = await supabase
        .from('villages')
        .select('id, name, regency, district, subdistrict, description, image_url, location_lat, location_lng, contact_name, contact_phone, contact_email, registration_status, is_active, registered_at')
        .order('registered_at', { ascending: false });

      if (error) throw error;

      // Fetch user_villages to get owner info
      const villageIds = (villagesData || []).map(v => v.id);
      let ownerMap: Record<string, { full_name: string | null; phone: string | null }> = {};
      
      if (villageIds.length > 0) {
        const { data: userVillages } = await supabase
          .from('user_villages')
          .select('village_id, user_id')
          .in('village_id', villageIds);
        
        if (userVillages && userVillages.length > 0) {
          const userIds = userVillages.map(uv => uv.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, phone')
            .in('user_id', userIds);
          
          const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
          for (const uv of userVillages) {
            const profile = profileMap.get(uv.user_id);
            ownerMap[uv.village_id] = {
              full_name: profile?.full_name || null,
              phone: profile?.phone || null,
            };
          }
        }
      }

      const enriched: VillageRow[] = (villagesData || []).map(v => ({
        ...v,
        owner_name: ownerMap[v.id]?.full_name || null,
        owner_phone: ownerMap[v.id]?.phone || null,
      }));
      
      setVillages(enriched);
    } catch (error) {
      console.error('Error fetching villages:', error);
      toast.error('Gagal memuat data desa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVillagesData();
  }, []);

  const handleApprove = async (id: string) => {
    const success = await approveVillage(id);
    if (success) { toast.success('Desa wisata berhasil disetujui'); fetchVillagesData(); }
    else toast.error('Gagal menyetujui desa wisata');
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;
    const success = await rejectVillage(id, reason);
    if (success) { toast.success('Desa wisata ditolak'); fetchVillagesData(); }
    else toast.error('Gagal menolak desa wisata');
  };

  const handleDelete = async () => {
    if (!selectedVillage) return;
    const success = await deleteVillage(selectedVillage.id);
    if (success) { toast.success('Desa wisata berhasil dihapus'); fetchVillagesData(); setDeleteDialogOpen(false); }
    else toast.error('Gagal menghapus desa wisata');
  };

  const getStatusBadge = (regStatus: string, isActive: boolean) => {
    if (regStatus === 'PENDING') return <Badge variant="secondary" className="bg-warning/10 text-warning">Menunggu</Badge>;
    if (regStatus === 'REJECTED') return <Badge variant="destructive">Ditolak</Badge>;
    if (isActive) return <Badge className="bg-success/10 text-success">Aktif</Badge>;
    return <Badge variant="outline">Nonaktif</Badge>;
  };

  const columns = [
    {
      key: 'image',
      header: 'Gambar',
      render: (item: VillageRow) => (
        <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center border">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nama Desa',
      render: (item: VillageRow) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{item.description || '-'}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Lokasi',
      render: (item: VillageRow) => (
        <div className="text-sm">
          <p className="font-medium">{item.district}</p>
          <p className="text-xs text-muted-foreground">{item.regency}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Pengelola',
      render: (item: VillageRow) => (
        <div className="text-sm">
          {item.owner_name ? (
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary">{item.owner_name}</p>
                {item.owner_phone && <p className="text-xs text-muted-foreground">{item.owner_phone}</p>}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs">Belum ada</span>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Kontak',
      render: (item: VillageRow) => (
        <div className="text-sm">
          <p>{item.contact_name || '-'}</p>
          <p className="text-xs text-muted-foreground">{item.contact_phone || '-'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: VillageRow) => getStatusBadge(item.registration_status, item.is_active),
    },
    {
      key: 'registered_at',
      header: 'Terdaftar',
      render: (item: VillageRow) => 
        item.registered_at ? new Date(item.registered_at).toLocaleDateString('id-ID') : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (item: VillageRow) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin/villages/${item.id}`)}>
              <Eye className="h-4 w-4 mr-2" />Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedVillage(item); setEditDialogOpen(true); }}>
              <Edit className="h-4 w-4 mr-2" />Edit
            </DropdownMenuItem>
            {item.registration_status === 'PENDING' && (
              <>
                <DropdownMenuItem onClick={() => handleApprove(item.id)}>
                  <Check className="h-4 w-4 mr-2" />Setujui
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReject(item.id)} className="text-destructive">
                  <X className="h-4 w-4 mr-2" />Tolak
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedVillage(item); setDeleteDialogOpen(true); }}>
              <Trash2 className="h-4 w-4 mr-2" />Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = [
    {
      key: 'registration_status',
      label: 'Status',
      options: [
        { value: 'PENDING', label: 'Menunggu' },
        { value: 'APPROVED', label: 'Disetujui' },
        { value: 'REJECTED', label: 'Ditolak' },
      ],
    },
  ];

  return (
    <AdminLayout title="Manajemen Desa Wisata" subtitle="Kelola semua desa wisata yang terdaftar">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="text-muted-foreground text-sm">{villages.length} desa terdaftar</span>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Tambah Desa
        </Button>
      </div>

      <DataTable
        data={villages}
        columns={columns}
        searchKeys={['name', 'owner_name']}
        searchPlaceholder="Cari nama desa atau pengelola..."
        filters={filters}
        loading={loading}
        emptyMessage="Belum ada desa wisata terdaftar"
      />

      <VillageAddDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSuccess={fetchVillagesData} />

      {selectedVillage && (
        <VillageEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          villageId={selectedVillage.id}
          initialData={{
            name: selectedVillage.name,
            province: '',
            regency: selectedVillage.regency,
            district: selectedVillage.district,
            subdistrict: selectedVillage.subdistrict,
            description: selectedVillage.description,
            image_url: selectedVillage.image_url,
            location_lat: selectedVillage.location_lat,
            location_lng: selectedVillage.location_lng,
            contact_name: selectedVillage.contact_name,
            contact_phone: selectedVillage.contact_phone,
            contact_email: selectedVillage.contact_email,
            is_active: selectedVillage.is_active,
          }}
          onSuccess={fetchVillagesData}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Desa <strong>{selectedVillage?.name}</strong> akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
