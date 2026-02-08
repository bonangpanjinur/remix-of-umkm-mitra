import { forwardRef } from 'react';
import { formatPrice } from '@/lib/utils';

interface POSTransactionItem {
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface POSTransaction {
  id: string;
  transaction_number: string;
  customer_name: string | null;
  items: POSTransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  notes: string | null;
  created_at: string;
}

interface POSSettings {
  invoice_header?: string | null;
  invoice_footer?: string | null;
  show_logo?: boolean;
  show_address?: boolean;
  show_phone?: boolean;
  paper_size?: string;
  font_size?: string;
}

interface POSInvoiceProps {
  transaction: POSTransaction;
  merchantName: string;
  merchantAddress: string | null;
  merchantPhone: string | null;
  settings?: POSSettings | null;
}

export const POSInvoice = forwardRef<HTMLDivElement, POSInvoiceProps>(
  ({ transaction, merchantName, merchantAddress, merchantPhone, settings }, ref) => {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const paymentMethodLabel = {
      CASH: 'Tunai',
      QRIS: 'QRIS',
      TRANSFER: 'Transfer',
    }[transaction.payment_method] || transaction.payment_method;

    const fontSize = settings?.font_size === 'small' ? 'text-[10px]' : settings?.font_size === 'large' ? 'text-sm' : 'text-xs';

    return (
      <div
        ref={ref}
        className={`bg-white text-black p-4 w-[300px] font-mono ${fontSize}`}
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          {settings?.invoice_header ? (
            <p className="text-xs whitespace-pre-wrap mb-1">{settings.invoice_header}</p>
          ) : null}
          <h1 className="font-bold text-base">{merchantName}</h1>
          {(settings?.show_address !== false) && merchantAddress && (
            <p className="text-[10px] text-gray-600">{merchantAddress}</p>
          )}
          {(settings?.show_phone !== false) && merchantPhone && (
            <p className="text-[10px] text-gray-600">{merchantPhone}</p>
          )}
        </div>

        {/* Transaction Info */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5">
          <div className="flex justify-between">
            <span>No:</span>
            <span className="font-bold">{transaction.transaction_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span>{formatDate(transaction.created_at)}</span>
          </div>
          {transaction.customer_name && (
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span>{transaction.customer_name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Bayar:</span>
            <span>{paymentMethodLabel}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          {transaction.items.map((item, i) => (
            <div key={i} className="mb-1">
              <p className="font-medium">{item.product_name}</p>
              <div className="flex justify-between text-gray-600">
                <span>{item.quantity} x {formatPrice(item.price)}</span>
                <span>{formatPrice(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(transaction.subtotal)}</span>
          </div>
          {transaction.discount > 0 && (
            <div className="flex justify-between">
              <span>Diskon</span>
              <span>-{formatPrice(transaction.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1 mt-1">
            <span>TOTAL</span>
            <span>{formatPrice(transaction.total)}</span>
          </div>
          {transaction.payment_method === 'CASH' && (
            <>
              <div className="flex justify-between">
                <span>Bayar</span>
                <span>{formatPrice(transaction.payment_amount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Kembali</span>
                <span>{formatPrice(transaction.change_amount)}</span>
              </div>
            </>
          )}
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-400">
            <p className="text-[10px] text-gray-600">Catatan: {transaction.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-400">
          {settings?.invoice_footer ? (
            <p className="text-[10px] whitespace-pre-wrap">{settings.invoice_footer}</p>
          ) : (
            <p className="text-[10px]">Terima kasih atas kunjungan Anda!</p>
          )}
        </div>
      </div>
    );
  }
);

POSInvoice.displayName = 'POSInvoice';

export function printPOSInvoice(element: HTMLElement | null) {
  if (!element) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup diblokir. Izinkan popup untuk mencetak.');
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk POS</title>
      <style>
        body { margin: 0; padding: 10px; font-family: monospace; background: white; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      ${element.outerHTML}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
