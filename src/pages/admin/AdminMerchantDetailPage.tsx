import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Store, MapPin, Phone, Clock, Star, Package, 
  ShoppingCart, Check, X, Edit, MoreHorizontal, Tag, Users,
  Calendar, CreditCard, TrendingUp, Plus, Trash2
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { approveMerchant, rejectMerchant, deleteMerchant } from '@/lib/adminApi';
import { MerchantEditDialog } from '@/components/admin/MerchantEditDialog';
import { AssignPackageDialog } from '@/components/admin/AssignPackageDialog';

interface MerchantDetail {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  subdistrict: string | null;
  business_category: string | null;
  business_description: string | null;
  open_time: string | null;
  close_time: string | null;
  image_url: string | null;
  is_open: boolean;
  status: string;
  registration_status: string;
  registered_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  available_balance: number | null;
  pending_balance: number | null;
  total_withdrawn: number | null;
  trade_group: string | null;
  verifikator_code: string | null;
  badge: string | null;
  order_mode: string;
  is_verified: boolean | null;
  villages: { name: string } | null;
}

interface ProductSummary {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
}

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  created_at: string;
}

export default function AdminMerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (id) {
      fetchMerchantData();
    }
  }, [id]);

  const fetchMerchantData = async () => {
    try {
      // Fetch merchant details
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*, villages(name)')
        .eq('id', id)
        .single();

      if (merchantError) throw merchantError;
      setMerchant(merchantData);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, stock, is_active, image_url')
        .eq('merchant_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!productsError && productsData) {
        setProducts(productsData);
      }

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total, created_at')
        .eq('merchant_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!ordersError && ordersData) {
        setOrders(ordersData);
      }

      // Fetch stats
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', id);

      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', id)
        .eq('is_active', true);

      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', id);

      const { count: completedOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', id)
        .eq('status', 'DONE');

      const { data: revenueData } = await supabase
        .from('orders')
        .select('total')
        .eq('merchant_id', id)
        .eq('status', 'DONE');

      const totalRevenue = revenueData?.reduce((sum, o) => sum + o.total, 0) || 0;

      setStats({
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalOrders: totalOrders || 0,
        completedOrders: completedOrders || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching merchant:', error);
      toast.error('Gagal memuat data merchant');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    const success = await approveMerchant(id);
    if (success) {
      toast.success('Merchant berhasil disetujui');
      fetchMerchantData();
    } else {
      toast.error('Gagal menyetujui merchant');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;
    
    const success = await rejectMerchant(id, reason);
    if (success) {
      toast.success('Merchant ditolak');
      fetchMerchantData();
    } else {
      toast.error('Gagal menolak merchant');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus merchant ini? Semua data terkait akan ikut terhapus.')) return;
    
    const success = await deleteMerchant(id);
    if (success) {
      toast.success('Merchant berhasil dihapus');
      navigate('/admin/merchants');
    } else {
      toast.error('Gagal menghapus merchant');
    }
  };

  const getStatusBadge = (status: string, regStatus: string) => {
    if (regStatus === 'PENDING') {
      return <Badge variant="warning">Menunggu Verifikasi</Badge>;
    }
    if (regStatus === 'REJECTED') {
      return <Badge variant="destructive">Ditolak</Badge>;
    }
    if (status === 'ACTIVE') {
      return <Badge variant="success">Aktif</Badge>;
    }
    return <Badge variant="outline">Nonaktif</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout title="Detail Merchant" subtitle="Memuat data...">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!merchant) {
    return (
      <AdminLayout title="Merchant Tidak Ditemukan" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Merchant tidak ditemukan atau sudah dihapus.</p>
          <Button onClick={() => navigate('/admin/merchants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={merchant.name} 
      subtitle={merchant.business_category || 'Merchant'}
    >
      {/* Back button & actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/merchants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="flex gap-2">
          {merchant.registration_status === 'PENDING' && (
            <>
              <Button size="sm" onClick={handleApprove}>
                <Check className="h-4 w-4 mr-1" />
                Setujui
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject}>
                <X className="h-4 w-4 mr-1" />
                Tolak
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setPackageDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Paket
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Data Merchant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPackageDialogOpen(true)}>
                <Package className="h-4 w-4 mr-2" />
                Tambah Paket Transaksi
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Merchant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Merchant Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Avatar className="h-20 w-20 rounded-xl">
              <AvatarImage src={merchant.image_url || ''} alt={merchant.name} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xl">
                <Store className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{merchant.name}</h2>
                  <p className="text-sm text-muted-foreground">{merchant.business_category || '-'}</p>
                </div>
                {getStatusBadge(merchant.status, merchant.registration_status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{merchant.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{merchant.villages?.name || merchant.subdistrict || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{merchant.open_time || '08:00'} - {merchant.close_time || '17:00'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span>{merchant.rating_avg || 0} ({merchant.rating_count || 0} ulasan)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Produk</p>
                <p className="text-lg font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pesanan</p>
                <p className="text-lg font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Omzet</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <CreditCard className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Tersedia</p>
                <p className="text-lg font-bold">{formatCurrency(merchant.available_balance || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="orders">Pesanan</TabsTrigger>
          <TabsTrigger value="finance">Keuangan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Bisnis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-sm text-muted-foreground">Kategori</p>
                  <p className="text-sm font-medium col-span-2">{merchant.business_category || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-sm text-muted-foreground">Deskripsi</p>
                  <p className="text-sm col-span-2">{merchant.business_description || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-sm text-muted-foreground">Grup Dagang</p>
                  <p className="text-sm font-medium col-span-2">{merchant.trade_group || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-sm text-muted-foreground">Kode Verifikator</p>
                  <p className="text-sm font-medium col-span-2">{merchant.verifikator_code || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lokasi & Alamat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-sm text-muted-foreground">Provinsi</p>
                  <p className="text-sm font-medium col-span-2">{merchant.province || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-sm text-muted-foreground">Kota/Kab</p>
                  <p className="text-sm font-medium col-span-2">{merchant.city || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-sm text-muted-foreground">Kecamatan</p>
                  <p className="text-sm font-medium col-span-2">{merchant.district || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-sm text-muted-foreground">Alamat</p>
                  <p className="text-sm col-span-2">{merchant.address || '-'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Produk Terbaru</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/merchants/${id}/products`)}>
                Lihat Semua
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Belum ada produk.</p>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarImage src={product.image_url || ''} />
                          <AvatarFallback className="rounded-md"><Package className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(product.price)} • Stok: {product.stock}</p>
                        </div>
                      </div>
                      <Badge variant={product.is_active ? 'success' : 'secondary'}>
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/merchants/${id}/orders`)}>
                Lihat Semua
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Belum ada pesanan.</p>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('id-ID')} • {formatCurrency(order.total)}
                        </p>
                      </div>
                      <Badge>{order.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Tersedia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">{formatCurrency(merchant.available_balance || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Tertunda</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-warning">{formatCurrency(merchant.pending_balance || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Penarikan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatCurrency(merchant.total_withdrawn || 0)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MerchantEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        merchantId={merchant.id}
        initialData={{
          name: merchant.name,
          phone: merchant.phone,
          address: merchant.address,
          province: merchant.province,
          city: merchant.city,
          district: merchant.district,
          subdistrict: merchant.subdistrict,
          open_time: merchant.open_time,
          close_time: merchant.close_time,
          business_category: merchant.business_category,
          business_description: merchant.business_description,
          is_open: merchant.is_open,
          status: merchant.status,
          badge: merchant.badge,
          order_mode: merchant.order_mode,
          is_verified: merchant.is_verified,
          image_url: merchant.image_url,
        }}
        onSuccess={fetchMerchantData}
      />

      <AssignPackageDialog
        open={packageDialogOpen}
        onOpenChange={setPackageDialogOpen}
        merchantId={id || ''}
        merchantName={merchant.name}
        onSuccess={fetchMerchantData}
      />
    </AdminLayout>
  );
}
