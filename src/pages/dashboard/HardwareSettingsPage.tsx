import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Printer, ScanLine, Camera, Bluetooth, Wifi, Usb, Check, X, Volume2, Settings, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

const HardwareSettingsPage = () => {
  const [printerType, setPrinterType] = useState<"usb" | "bluetooth" | "wifi">("usb");
  const [paperSize, setPaperSize] = useState<"58mm" | "80mm">("80mm");
  const [printerConnected, setPrinterConnected] = useState(false);
  const [scannerAutoAdd, setScannerAutoAdd] = useState(true);
  const [scannerSound, setScannerSound] = useState(true);
  const [scannerAutoFocus, setScannerAutoFocus] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Check camera permission on mount
    navigator.permissions?.query({ name: "camera" as PermissionName }).then(status => {
      setCameraPermission(status.state === "granted" ? "granted" : status.state === "denied" ? "denied" : "unknown");
      status.onchange = () => setCameraPermission(status.state === "granted" ? "granted" : status.state === "denied" ? "denied" : "unknown");
    }).catch(() => {});
    return () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); };
  }, []);

  const testPrint = () => {
    const printWindow = window.open("", "_blank", "width=300,height=200");
    if (!printWindow) return;
    printWindow.document.write(`<html><body style="font-family:monospace;text-align:center;padding:40px"><h2>✅ Printer Connected Successfully</h2><p>Paper: ${paperSize}</p><p>Type: ${printerType.toUpperCase()}</p></body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
    setPrinterConnected(true);
    toast({ title: "Test print sent!" });
  };

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach(t => t.stop());
      setCameraPermission("granted");
      toast({ title: "✅ Camera access granted!" });
    } catch {
      setCameraPermission("denied");
      toast({ title: "Camera access denied", description: "Enable camera in your browser settings.", variant: "destructive" });
    }
  }, []);

  const startCameraScanner = useCallback(async () => {
    if (cameraPermission !== "granted") { await requestCamera(); return; }
    setCameraActive(true);
    try {
      const scanner = new Html5Qrcode("hw-barcode-scanner");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (text) => {
          if (scannerSound) { const a = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"); a.play().catch(() => {}); }
          toast({ title: "🔍 Barcode detected!", description: text });
          scanner.stop().catch(() => {});
          setCameraActive(false);
        },
        () => {}
      );
    } catch {
      toast({ title: "Camera error", variant: "destructive" });
      setCameraActive(false);
    }
  }, [cameraPermission, scannerSound, requestCamera]);

  const Toggle = ({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div><p className="text-sm font-display font-semibold text-foreground">{label}</p><p className="text-xs text-muted-foreground font-body mt-0.5">{desc}</p></div>
      <button onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full transition-colors relative ${value ? "bg-primary" : "bg-muted"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Hardware & Devices</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Connect printers, scanners, and configure camera permissions</p>
      </div>

      {/* 1. Printer Setup */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 border border-border space-y-5">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Printer size={16} className="text-primary" /> Printer Setup</h3>

        <div>
          <label className="block text-xs font-display font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Connection Type</label>
          <div className="grid grid-cols-3 gap-3">
            {([["usb", Usb, "USB"], ["bluetooth", Bluetooth, "Bluetooth"], ["wifi", Wifi, "WiFi/Network"]] as const).map(([key, Icon, label]) => (
              <button key={key} onClick={() => setPrinterType(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${printerType === key ? "border-primary bg-accent" : "border-border hover:border-primary/30"}`}>
                <Icon size={20} className={printerType === key ? "text-primary" : "text-muted-foreground"} />
                <span className="text-xs font-display font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-display font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Paper Size</label>
          <div className="flex gap-3">
            {(["58mm", "80mm"] as const).map(size => (
              <button key={size} onClick={() => setPaperSize(size)}
                className={`flex-1 py-3 rounded-xl border-2 font-display font-semibold text-sm transition-all ${paperSize === size ? "border-primary bg-accent text-primary" : "border-border text-foreground hover:border-primary/30"}`}>
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={testPrint}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all">
            <Printer size={14} /> Test Print
          </button>
          {printerConnected && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent text-primary text-sm font-display font-semibold">
              <Check size={14} /> Connected
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. Barcode Scanner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl p-6 border border-border space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2"><ScanLine size={16} className="text-primary" /> Barcode Scanner</h3>
        <p className="text-xs text-muted-foreground font-body">Most barcode scanners act as keyboard input. These settings control scan behavior in the POS.</p>
        <Toggle value={scannerAutoFocus} onChange={setScannerAutoFocus} label="Auto-focus on barcode input" desc="Cursor automatically moves to search/barcode field" />
        <Toggle value={scannerAutoAdd} onChange={setScannerAutoAdd} label="Auto-add item when scanned" desc="Automatically add product to cart after scanning" />
        <Toggle value={scannerSound} onChange={setScannerSound} label="Play sound when product found" desc="Audible beep confirmation on successful scan" />
      </motion.div>

      {/* 3. Camera Scanner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 border border-border space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Camera size={16} className="text-primary" /> Camera Barcode Scanner</h3>

        <div className={`p-4 rounded-xl ${cameraPermission === "granted" ? "bg-accent" : cameraPermission === "denied" ? "bg-red-50 dark:bg-red-500/10" : "bg-secondary"}`}>
          <div className="flex items-center gap-3">
            {cameraPermission === "granted" ? <Check size={16} className="text-primary" /> : cameraPermission === "denied" ? <X size={16} className="text-red-500" /> : <AlertCircle size={16} className="text-muted-foreground" />}
            <div>
              <p className="text-sm font-display font-semibold text-foreground">
                {cameraPermission === "granted" ? "Camera access granted" : cameraPermission === "denied" ? "Camera access denied" : "Camera permission not set"}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                {cameraPermission === "denied" ? "Go to browser settings → Site Settings → Camera → Allow" : "Click below to request browser camera permission"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={requestCamera}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-foreground font-display font-semibold text-sm hover:bg-accent transition-all">
            <Camera size={14} /> Request Permission
          </button>
          <button onClick={startCameraScanner} disabled={cameraActive}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-50">
            <ScanLine size={14} /> {cameraActive ? "Scanning..." : "Test Camera Scan"}
          </button>
        </div>

        {cameraActive && (
          <div className="mt-4">
            <div id="hw-barcode-scanner" className="rounded-xl overflow-hidden" style={{ maxHeight: 280 }} />
            <button onClick={() => { scannerRef.current?.stop().catch(() => {}); setCameraActive(false); }}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-display font-semibold text-sm">
              <X size={14} /> Stop Camera
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HardwareSettingsPage;
