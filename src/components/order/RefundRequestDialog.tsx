import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface RefundRequestDialogProps {
  orderId: string;
  orderTotal: number;
  merchantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RefundRequestDialog({
  orderId,
  orderTotal,
  merchantId,
  open,
  onOpenChange,
  onSuccess,
}: RefundRequestDialogProps) {
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState(orderTotal.toString());
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Mohon masukkan alasan refund');
      return;
    }

    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload images if any
      const evidenceUrls: string[] = [];
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `refund-evidence/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public_assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public_assets')
          .getPublicUrl(filePath);
        
        evidenceUrls.push(publicUrl);
      }

      const { error } = await supabase
        .from('refund_requests')
        .insert({
          order_id: orderId,
          buyer_id: user.id,
          merchant_id: merchantId,
          amount: parseInt(amount),
          reason: reason,
          status: 'PENDING',
          evidence_urls: evidenceUrls,
          refund_type: parseInt(amount) === orderTotal ? 'FULL' : 'PARTIAL'
        });

      if (error) throw error;

      toast.success('Permintaan refund berhasil dikirim');
      onSuccess();
      onOpenChange(false);
      // Reset form
      setReason('');
      setAmount(orderTotal.toString());
      setImages([]);
      setPreviews([]);
    } catch (error) {
      console.error('Error submitting refund:', error);
      toast.error('Gagal mengirim permintaan refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajukan Refund</DialogTitle>
          <DialogDescription>
            Pesanan #{orderId.slice(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah Refund (Rp)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={orderTotal}
            />
            <p className="text-[10px] text-muted-foreground">Maksimal: Rp {orderTotal.toLocaleString('id-ID')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Refund</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan Anda meminta pengembalian dana..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Bukti Foto (Opsional)</Label>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-border">
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {previews.length < 4 && (
                <label className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} multiple />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Mengirim...' : 'Kirim Permintaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
