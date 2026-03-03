import { useRef } from "react";
import { Download, MessageCircle, Printer, X } from "lucide-react";
import logoImg from "@/assets/logo.png";

interface ReceiptItem {
  name: string;
  price: number;
  qty: number;
}

interface ReceiptData {
  orderId: string;
  shopName: string;
  shopLogo?: string;
  shopPhone?: string;
  shopPaybill?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone: string;
  date: Date;
}

interface ReceiptGeneratorProps {
  data: ReceiptData;
  onClose: () => void;
}

const ReceiptGenerator = ({ data, onClose }: ReceiptGeneratorProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank", "width=400,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt - ${data.orderId.slice(0, 8)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 320px; margin: 0 auto; font-size: 12px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #333; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .logo { width: 48px; height: 48px; margin: 0 auto 8px; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .small { font-size: 10px; color: #666; }
        .total-row { font-size: 16px; font-weight: bold; padding: 4px 0; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="center">
        <img src="${data.shopLogo || logoImg}" class="logo" alt="logo" onerror="this.style.display='none'" />
        <h1>${data.shopName}</h1>
        <p class="small">Receipt #${data.orderId.slice(0, 8).toUpperCase()}</p>
        <p class="small">${data.date.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} ${data.date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</p>
        ${data.customerName ? `<p class="small">Customer: ${data.customerName}</p>` : ""}
        <p class="small">Phone: ${data.customerPhone}</p>
      </div>
      <div class="line"></div>
      <div class="row bold"><span>Item</span><span>Total</span></div>
      <div class="line"></div>
      ${data.items.map(item => `
        <div class="row"><span>${item.name} x${item.qty}</span><span>KSh ${(item.price * item.qty).toLocaleString()}</span></div>
        <div class="small" style="padding-left:8px">@ KSh ${item.price.toLocaleString()} each</div>
      `).join("")}
      <div class="line"></div>
      <div class="row"><span>Subtotal</span><span>KSh ${data.subtotal.toLocaleString()}</span></div>
      ${data.discount > 0 ? `<div class="row"><span>Discount</span><span>-KSh ${data.discount.toLocaleString()}</span></div>` : ""}
      <div class="line"></div>
      <div class="row total-row"><span>TOTAL</span><span>KSh ${data.total.toLocaleString()}</span></div>
      <div class="line"></div>
      <div class="row"><span>Payment</span><span>${data.paymentMethod.toUpperCase()}</span></div>
      ${data.shopPaybill ? `<div class="line"></div><div class="center"><p class="bold">Paybill: ${data.shopPaybill}</p></div>` : ""}
      <div class="line"></div>
      <div class="center">
        <p class="bold">Thank you for shopping with us! 🙏</p>
        <p class="small" style="margin-top:4px">Powered by Vee Digital Solutions</p>
        <p class="small">www.veedigital.co.ke</p>
        <p class="small" style="margin-top:8px">© ${new Date().getFullYear()} ${data.shopName}. All rights reserved.</p>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleWhatsApp = () => {
    const items = data.items.map(i => `• ${i.name} x${i.qty} — KSh ${(i.price * i.qty).toLocaleString()}`).join("\n");
    const msg = encodeURIComponent(
      `🧾 *Receipt from ${data.shopName}*\n` +
      `📅 ${data.date.toLocaleDateString("en-KE")}\n\n` +
      `${items}\n\n` +
      `Subtotal: KSh ${data.subtotal.toLocaleString()}\n` +
      (data.discount > 0 ? `Discount: -KSh ${data.discount.toLocaleString()}\n` : "") +
      `*Total: KSh ${data.total.toLocaleString()}*\n` +
      `Payment: ${data.paymentMethod.toUpperCase()}\n\n` +
      (data.shopPaybill ? `Paybill: ${data.shopPaybill}\n\n` : "") +
      `Thank you for shopping with us! 🙏\n` +
      `Powered by Vee Digital Solutions`
    );
    const phone = data.customerPhone.startsWith("0") ? "254" + data.customerPhone.slice(1) : data.customerPhone;
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Receipt preview */}
        <div ref={receiptRef} className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="text-center">
            <img src={data.shopLogo || logoImg} alt="" className="w-12 h-12 rounded-xl mx-auto mb-2 object-contain" />
            <h2 className="font-display font-black text-lg text-foreground">{data.shopName}</h2>
            <p className="text-[10px] text-muted-foreground font-mono">#{data.orderId.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-muted-foreground font-body">{data.date.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>

          <div className="border-t border-dashed border-border pt-3 space-y-1.5">
            {data.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="font-body text-foreground">{item.name} <span className="text-muted-foreground">x{item.qty}</span></span>
                <span className="font-display font-semibold text-foreground">KSh {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-border pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-body">Subtotal</span>
              <span className="font-display font-semibold text-foreground">KSh {data.subtotal.toLocaleString()}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-red-400 font-body">Discount</span>
                <span className="font-display font-semibold text-red-400">-KSh {data.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1 border-t border-dashed border-border">
              <span className="font-display font-black text-foreground">TOTAL</span>
              <span className="font-display font-black text-primary">KSh {data.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-dashed border-border">
            <p className="text-xs font-display font-semibold text-foreground">Thank you for shopping with us! 🙏</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">Powered by Vee Digital Solutions</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border flex gap-2">
          <button onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-xs hover:opacity-90 transition-all">
            <Printer size={14} /> Print / Download
          </button>
          <button onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white font-display font-semibold text-xs hover:opacity-90 transition-all">
            <MessageCircle size={14} /> WhatsApp
          </button>
          <button onClick={onClose}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;
