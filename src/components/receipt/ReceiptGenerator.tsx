import { useRef } from "react";
import { MessageCircle, Printer, X } from "lucide-react";
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
  shopPaybillAccount?: string;
  shopTill?: string;
  shopSlogan?: string;
  shopIntroText?: string;
  shopThankYou?: string;
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
  if (words.length === 1) return name.length > 16 ? name.slice(0, 16) : name;
  const abbr = words.map(w => w.slice(0, 4).toUpperCase()).join(".");
  return abbr.length > 18 ? abbr.slice(0, 18) : abbr;
}

const ReceiptGenerator = ({ data, onClose }: ReceiptGeneratorProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const receiptNum = data.orderId.slice(0, 8).toUpperCase();
  const introText = data.shopIntroText || "Quality You Can Trust";
  const thankYou = data.shopThankYou || "THANK YOU FOR SHOPPING WITH US";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=420,height=900");
    if (!printWindow) return;

    const itemsHtml = data.items.map(item => {
      const abbr = abbreviate(item.name);
      const lineTotal = (item.price * item.qty).toLocaleString();
      return `
        <div class="item-row">
          <span class="item-name">${abbr}</span>
          <span class="item-qty">${item.qty} x ${item.price.toLocaleString()}</span>
          <span class="item-total bold">${lineTotal}</span>
        </div>`;
    }).join("");

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>Receipt #${receiptNum}</title>
      <meta charset="UTF-8" />
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New',Courier,monospace; max-width:320px; margin:0 auto; padding:14px 10px; font-size:11px; color:#000; background:#fff; }
        .center { text-align:center; }
        .bold { font-weight:bold; }
        .sep { border-top:1px dashed #555; margin:5px 0; }
        .double-sep { border-top:2px solid #000; margin:5px 0; }
        .logo { width:52px; height:52px; margin:0 auto 6px; display:block; object-fit:contain; border-radius:6px; }
        .shop-name { font-size:17px; font-weight:900; text-transform:uppercase; letter-spacing:2px; }
        .shop-intro { font-size:9px; color:#555; margin-top:3px; font-style:italic; }
        .meta { font-size:9px; color:#666; line-height:1.6; }
        .header-row { display:flex; justify-content:space-between; font-weight:bold; font-size:10px; padding:3px 0; }
        .item-row { display:flex; justify-content:space-between; align-items:baseline; padding:2px 0; font-size:11px; gap:4px; }
        .item-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .item-qty { font-size:9px; color:#555; white-space:nowrap; margin:0 4px; }
        .item-total { white-space:nowrap; }
        .total-section { padding:3px 0; }
        .total-row { display:flex; justify-content:space-between; padding:2px 0; font-size:11px; }
        .grand-total { font-size:16px; font-weight:900; padding:4px 0; }
        .payment-box { background:#f0f8f0; border:1px solid #ccc; padding:6px 8px; border-radius:4px; margin:5px 0; }
        .footer { font-size:9px; color:#666; line-height:1.7; margin-top:6px; }
        .footer .thanks { font-size:12px; font-weight:bold; color:#000; }
        @media print { body { padding:0; } @page { margin:4mm; } }
      </style>
    </head><body>
      <div class="center">
        <img src="${data.shopLogo || logoImg}" class="logo" alt="" onerror="this.style.display='none'" />
        <div class="shop-name">${data.shopName}</div>
        <div class="shop-intro">${introText}</div>
        ${data.shopLocation ? `<div class="meta">${data.shopLocation}</div>` : ""}
        ${data.shopPhone ? `<div class="meta">Tel: ${data.shopPhone}</div>` : ""}
      </div>
      <div class="sep"></div>
      <div class="meta center">
        Receipt #: ${receiptNum}<br/>
        Date: ${data.date.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} ${data.date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}<br/>
        ${data.cashierName ? `Cashier: ${data.cashierName}<br/>` : ""}
        ${data.customerName ? `Customer: ${data.customerName}<br/>` : ""}
        Phone: ${data.customerPhone}
      </div>
      <div class="double-sep"></div>
      <div class="header-row"><span>ITEM</span><span>QTY × PRICE</span><span>TOTAL</span></div>
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
          ${data.shopPaybill ? `<div class="bold">M-PESA PAYBILL: ${data.shopPaybill}</div>${data.shopPaybillAccount ? `<div>Account No: ${data.shopPaybillAccount}</div>` : ""}` : ""}
          ${data.shopTill ? `<div class="bold">M-PESA TILL: ${data.shopTill}</div>` : ""}
        </div>
      ` : ""}
      <div class="sep"></div>
      <div class="center footer">
        <div class="thanks">${thankYou} 🙏</div>
        ${data.shopSlogan ? `<div>"${data.shopSlogan}"</div>` : ""}
        <div style="margin-top:4px">Powered by Vlogic Digital Solution</div>
        <div>www.vdigitalsolution.online</div>
        <div style="margin-top:4px">© ${new Date().getFullYear()} Duka Langu. All rights reserved.</div>
      </div>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);
  };

  const handleWhatsApp = () => {
    const items = data.items.map(i => `• ${i.name} ×${i.qty} — KES ${(i.price * i.qty).toLocaleString()}`).join("\n");
    const msg = encodeURIComponent(
      `🧾 *Receipt from ${data.shopName}*\n` +
      `📅 ${data.date.toLocaleDateString("en-KE")} ${data.date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}\n` +
      `Receipt #${receiptNum}\n\n` +
      `${items}\n\n` +
      `Subtotal: KES ${data.subtotal.toLocaleString()}\n` +
      (data.discount > 0 ? `Discount: -KES ${data.discount.toLocaleString()}\n` : "") +
      `*TOTAL: KES ${data.total.toLocaleString()}*\n` +
      `Payment: ${data.paymentMethod.toUpperCase()}\n\n` +
      (data.shopPaybill ? `Paybill: ${data.shopPaybill}${data.shopPaybillAccount ? ` · A/C: ${data.shopPaybillAccount}` : ""}\n` : "") +
      (data.shopTill ? `Till: ${data.shopTill}\n` : "") +
      `\n${thankYou} 🙏\n` +
      (data.shopSlogan ? `"${data.shopSlogan}"\n` : "") +
      `Powered by Vlogic Digital Solution\nwww.vdigitalsolution.online`
    );
    const phone = data.customerPhone.startsWith("0") ? "254" + data.customerPhone.slice(1) : data.customerPhone;
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Receipt Preview */}
        <div ref={receiptRef} className="p-5 space-y-3 max-h-[65vh] overflow-y-auto font-mono text-xs bg-white dark:bg-card">
          {/* Header */}
          <div className="text-center space-y-1">
            <img
              src={data.shopLogo || logoImg}
              alt=""
              className="w-14 h-14 rounded-xl mx-auto object-contain border border-border"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <h2 className="font-display font-black text-base text-foreground uppercase tracking-widest">{data.shopName}</h2>
            <p className="text-[10px] text-muted-foreground italic">{introText}</p>
            {data.shopLocation && <p className="text-[9px] text-muted-foreground">{data.shopLocation}</p>}
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Meta */}
          <div className="text-center space-y-0.5">
            <p className="text-[9px] text-muted-foreground">Receipt #{receiptNum}</p>
            <p className="text-[9px] text-muted-foreground">
              {data.date.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}{" "}
              {data.date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {data.cashierName && <p className="text-[9px] text-muted-foreground">Cashier: {data.cashierName}</p>}
            {data.customerName && <p className="text-[9px] text-muted-foreground">Customer: {data.customerName}</p>}
            <p className="text-[9px] text-muted-foreground">Phone: {data.customerPhone}</p>
          </div>

          {/* Items header */}
          <div className="border-t-2 border-foreground pt-2">
            <div className="flex justify-between text-[10px] font-bold text-foreground mb-1 px-0.5">
              <span>ITEM</span><span>TOTAL</span>
            </div>
            <div className="border-t border-dashed border-border" />
          </div>

          {/* Items */}
          <div className="space-y-1.5">
            {data.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-foreground">
                  <span className="font-semibold truncate max-w-[60%]">{abbreviate(item.name)}</span>
                  <span className="font-bold">KES {(item.price * item.qty).toLocaleString()}</span>
                </div>
                <p className="text-[9px] text-muted-foreground pl-1">{item.qty} × KES {item.price.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t-2 border-foreground pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">KES {data.subtotal.toLocaleString()}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-red-500">Discount</span>
                <span className="font-semibold text-red-500">-KES {data.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-dashed border-border" />
            <div className="flex justify-between text-sm pt-0.5">
              <span className="font-display font-black text-foreground">TOTAL</span>
              <span className="font-display font-black text-primary">KES {data.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="border-t border-dashed border-border pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-bold text-foreground">{data.paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          {/* Paybill / Till */}
          {(data.shopPaybill || data.shopTill) && (
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-center space-y-0.5">
              {data.shopPaybill && (
                <>
                  <p className="text-xs font-bold text-green-800 dark:text-green-300">PAYBILL: {data.shopPaybill}</p>
                  {data.shopPaybillAccount && (
                    <p className="text-[10px] text-green-700 dark:text-green-400">Account No: {data.shopPaybillAccount}</p>
                  )}
                </>
              )}
              {data.shopTill && (
                <p className="text-xs font-bold text-green-800 dark:text-green-300">TILL: {data.shopTill}</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-2 border-t border-dashed border-border space-y-0.5">
            <p className="text-xs font-display font-bold text-foreground">{thankYou} 🙏</p>
            {data.shopSlogan && <p className="text-[10px] text-muted-foreground italic">&ldquo;{data.shopSlogan}&rdquo;</p>}
            <p className="text-[9px] text-muted-foreground mt-1">Powered by Vlogic Digital Solution</p>
            <p className="text-[9px] text-muted-foreground">www.vdigitalsolution.online</p>
            <p className="text-[9px] text-muted-foreground">© {new Date().getFullYear()} Duka Langu. All rights reserved.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border flex gap-2 bg-card">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-xs hover:opacity-90 transition-all shadow-brand"
          >
            <Printer size={14} /> Print / Download
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white font-display font-semibold text-xs hover:opacity-90 transition-all"
          >
            <MessageCircle size={14} /> WhatsApp
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;
