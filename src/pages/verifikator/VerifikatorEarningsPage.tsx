import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { VerifikatorLayout } from '@/components/verifikator/VerifikatorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Earning {
  id: string;
  merchant_id: string;
  package_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  merchant?: { name: string };
  package?: { name: string };
}

export default function VerifikatorEarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    totalTransactions: 0,
  });

  useEffect(() => {
    if (user) fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('verifikator_earnings')
        .select(`
          *,
          merchant:merchants(name),
          package:transaction_packages(name)
        `)
        .eq('verifikator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const earningsData = data || [];
      setEarnings(earningsData);

      // Calculate stats
      const total = earningsData.reduce((sum, e) => sum + e.commission_amount, 0);
      const pending = earningsData
        .filter(e => e.status === 'PENDING')
        .reduce((sum, e) => sum + e.commission_amount, 0);
      const paid = earningsData
        .filter(e => e.status === 'PAID')
        .reduce((sum, e) => sum + e.commission_amount, 0);

      setStats({
        totalEarnings: total,
        pendingEarnings: pending,
        paidEarnings: paid,
        totalTransactions: earningsData.length,
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <VerifikatorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </VerifikatorLayout>
    );
  }

  return (
    <VerifikatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pendapatan Komisi</h1>
          <p className="text-muted-foreground">
            Komisi dari pembelian paket transaksi oleh pedagang
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(stats.totalEarnings)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatPrice(stats.pendingEarnings)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sudah Dibayar</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(stats.paidEarnings)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Komisi</CardTitle>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada komisi dari pembelian paket
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pedagang</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead className="text-right">Harga Paket</TableHead>
                    <TableHead className="text-right">Komisi (%)</TableHead>
                    <TableHead className="text-right">Komisi (Rp)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell>
                        {format(new Date(earning.created_at), 'dd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {earning.merchant?.name || '-'}
                      </TableCell>
                      <TableCell>{earning.package?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(earning.package_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {earning.commission_percent}%
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatPrice(earning.commission_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={earning.status === 'PAID' ? 'default' : 'secondary'}
                          className={
                            earning.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }
                        >
                          {earning.status === 'PAID' ? 'Dibayar' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </VerifikatorLayout>
  );
}
