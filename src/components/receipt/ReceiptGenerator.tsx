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
  shopTill?: string;
  shopSlogan?: string;
  shopLocation?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone: string;
  cashierName?: string;
  date: Date;
}

interface ReceiptGeneratorProps {
  data: ReceiptData;
  onClose: () => void;
}

// Generate abbreviated product name (Naivas-style)
function abbreviate(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) return name.length > 14 ? name.slice(0, 14) : name;
  const abbr = words.map(w => w.slice(0, 3).toUpperCase()).join(" ");
  return abbr.length > 16 ? abbr.slice(0, 16) : abbr;
}

// Dot-fill alignment
function dotFill(left: string, right: string, width: number = 32): string {
  const gap = width - left.length - right.length;
  return left + (gap > 0 ? ".".repeat(gap) : " ") + right;
}

const ReceiptGenerator = ({ data, onClose }: ReceiptGeneratorProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const receiptNum = data.orderId.slice(0, 8).toUpperCase();

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=400,height=800");
    if (!printWindow) return;
    const itemsHtml = data.items.map(item => {
      const abbr = abbreviate(item.name);
      const total = (item.price * item.qty).toLocaleString();
      return `
        <div class="item-row">
          <span>${abbr}</span>
          <span class="dots"></span>
          <span>${item.qty} x ${item.price.toLocaleString()}</span>
          <span class="dots"></span>
          <span class="bold">${total}</span>
        </div>
        <div class="item-detail">@ KES ${item.price.toLocaleString()} each</div>`;
    }).join("");

    printWindow.document.write(`<html><head><title>Receipt #${receiptNum}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; max-width:320px; margin:0 auto; padding:12px; font-size:11px; color:#000; }
      .center { text-align:center; }
      .bold { font-weight:bold; }
      .sep { border-top:1px dashed #555; margin:6px 0; }
      .double-sep { border-top:2px solid #000; margin:6px 0; }
      .logo { width:48px; height:48px; margin:0 auto 4px; display:block; }
      .shop-name { font-size:16px; font-weight:900; text-transform:uppercase; letter-spacing:1px; }
      .shop-intro { font-size:9px; color:#555; margin-top:2px; }
      .meta { font-size:9px; color:#666; line-height:1.5; }
      .header-row { display:flex; justify-content:space-between; font-weight:bold; font-size:10px; padding:2px 0; }
      .item-row { display:flex; align-items:baseline; gap:2px; padding:1px 0; font-size:11px; }
      .item-row .dots { flex:1; border-bottom:1px dotted #999; margin:0 2px; min-width:8px; }
      .item-detail { font-size:9px; color:#777; padding-left:8px; }
      .total-section { padding:4px 0; }
      .total-row { display:flex; justify-content:space-between; padding:1px 0; font-size:11px; }
      .grand-total { font-size:15px; font-weight:900; padding:4px 0; }
      .payment-box { background:#f5f5f5; padding:6px; border-radius:4px; margin:4px 0; }
      .footer { font-size:9px; color:#666; line-height:1.6; margin-top:4px; }
      .footer .thanks { font-size:11px; font-weight:bold; color:#000; }
      @media print { body { padding:0; } }
    </style></head><body>
      <div class="center">
        <img src="${data.shopLogo || logoImg}" class="logo" alt="" onerror="this.style.display='none'" />
        <div class="shop-name">${data.shopName}</div>
        ${data.shopSlogan ? `<div class="shop-intro">${data.shopSlogan}</div>` : ""}
        ${data.shopLocation ? `<div class="meta">${data.shopLocation}</div>` : ""}
        ${data.shopPhone ? `<div class="meta">Tel: ${data.shopPhone}</div>` : ""}
      </div>
      <div class="sep"></div>
      <div class="meta center">
        Receipt #: ${receiptNum}<br/>
        Date: ${data.date.toLocaleDateString("en-KE", { day:"numeric", month:"long", year:"numeric" })} ${data.date.toLocaleTimeString("en-KE", { hour:"2-digit", minute:"2-digit" })}<br/>
        ${data.cashierName ? `Cashier: ${data.cashierName}<br/>` : ""}
        ${data.customerName ? `Customer: ${data.customerName}<br/>` : ""}
        Phone: ${data.customerPhone}
      </div>
      <div class="double-sep"></div>
      <div class="header-row"><span>ITEM</span><span>QTY x PRICE</span><span>TOTAL</span></div>
      <div class="sep"></div>
      ${itemsHtml}
      <div class="double-sep"></div>
      <div class="total-section">
        <div class="total-row"><span>Subtotal</span><span>KES ${data.subtotal.toLocaleString()}</span></div>
        ${data.discount > 0 ? `<div class="total-row"><span>Discount</span><span>-KES ${data.discount.toLocaleString()}</span></div>` : ""}
        <div class="sep"></div>
        <div class="total-row grand-total"><span>TOTAL</span><span>KES ${data.total.toLocaleString()}</span></div>
      </div>
      <div class="sep"></div>
      <div class="total-row"><span>Payment</span><span class="bold">${data.paymentMethod.toUpperCase()}</span></div>
      ${(data.shopPaybill || data.shopTill) ? `
        <div class="sep"></div>
        <div class="payment-box center">
          ${data.shopPaybill ? `<div class="bold">M-PESA PAYBILL: ${data.shopPaybill}</div>` : ""}
          ${data.shopTill ? `<div class="bold">M-PESA TILL: ${data.shopTill}</div>` : ""}
        </div>
      ` : ""}
      <div class="sep"></div>
      <div class="center footer">
        <div class="thanks">Thank you for shopping with us! 🙏</div>
        ${data.shopSlogan ? `<div>"${data.shopSlogan}"</div>` : ""}
        <div>Powered by Vlogic Digital Solution</div>
        <div>www.vdigitalsolution.online</div>
        <div style="margin-top:4px">© ${new Date().getFullYear()} Duka Langu. All rights reserved.</div>
      </div>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleWhatsApp = () => {
    const items = data.items.map(i => `• ${i.name} x${i.qty} — KES ${(i.price * i.qty).toLocaleString()}`).join("\n");
    const msg = encodeURIComponent(
      `🧾 *Receipt from ${data.shopName}*\n` +
      `📅 ${data.date.toLocaleDateString("en-KE")} ${data.date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}\n` +
      `Receipt #${receiptNum}\n\n` +
      `${items}\n\n` +
      `Subtotal: KES ${data.subtotal.toLocaleString()}\n` +
      (data.discount > 0 ? `Discount: -KES ${data.discount.toLocaleString()}\n` : "") +
      `*TOTAL: KES ${data.total.toLocaleString()}*\n` +
      `Payment: ${data.paymentMethod.toUpperCase()}\n\n` +
      (data.shopPaybill ? `Paybill: ${data.shopPaybill}\n` : "") +
      (data.shopTill ? `Till: ${data.shopTill}\n` : "") +
      `\nThank you for shopping with us! 🙏\n` +
      (data.shopSlogan ? `"${data.shopSlogan}"\n` : "") +
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
        <div ref={receiptRef} className="p-6 space-y-3 max-h-[60vh] overflow-y-auto font-mono text-xs">
          <div className="text-center">
            <img src={data.shopLogo || logoImg} alt="" className="w-12 h-12 rounded-xl mx-auto mb-2 object-contain" />
            <h2 className="font-display font-black text-lg text-foreground uppercase tracking-wide">{data.shopName}</h2>
            {data.shopSlogan && <p className="text-[10px] text-muted-foreground italic">{data.shopSlogan}</p>}
            <p className="text-[10px] text-muted-foreground mt-1">Receipt #{receiptNum}</p>
            <p className="text-[10px] text-muted-foreground">{data.date.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            {data.cashierName && <p className="text-[10px] text-muted-foreground">Cashier: {data.cashierName}</p>}
          </div>

          <div className="border-t-2 border-foreground pt-2">
            <div className="flex justify-between text-[10px] font-bold text-foreground mb-1 px-1">
              <span>ITEM</span><span>TOTAL</span>
            </div>
            <div className="border-t border-dashed border-border" />
          </div>

          <div className="space-y-1.5">
            {data.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-foreground">
                  <span className="font-semibold">{abbreviate(item.name)}</span>
                  <span className="font-bold">KES {(item.price * item.qty).toLocaleString()}</span>
                </div>
                <p className="text-[9px] text-muted-foreground pl-1">{item.qty} x KES {item.price.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-foreground pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">KES {data.subtotal.toLocaleString()}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-red-400">Discount</span>
                <span className="font-semibold text-red-400">-KES {data.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-dashed border-border" />
            <div className="flex justify-between text-sm pt-1">
              <span className="font-display font-black text-foreground">TOTAL</span>
              <span className="font-display font-black text-primary">KES {data.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-bold text-foreground">{data.paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          {(data.shopPaybill || data.shopTill) && (
            <div className="p-2 rounded-lg bg-secondary text-center space-y-0.5">
              {data.shopPaybill && <p className="text-xs font-bold text-foreground">PAYBILL: {data.shopPaybill}</p>}
              {data.shopTill && <p className="text-xs font-bold text-foreground">TILL: {data.shopTill}</p>}
            </div>
          )}

          <div className="text-center pt-2 border-t border-dashed border-border space-y-1">
            <p className="text-xs font-display font-bold text-foreground">Thank you for shopping with us! 🙏</p>
            {data.shopSlogan && <p className="text-[10px] text-muted-foreground italic">"{data.shopSlogan}"</p>}
            <p className="text-[9px] text-muted-foreground">Powered by Vlogic Digital Solution • www.vdigitalsolution.online</p>
            <p className="text-[9px] text-muted-foreground">© {new Date().getFullYear()} Duka Langu. All rights reserved.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border flex gap-2">
          <button onClick={handlePrint}
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
