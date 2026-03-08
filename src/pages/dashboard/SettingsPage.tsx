import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Settings, Store, Palette, Bell, Shield,
  Save, Eye, EyeOff, Loader2,
  User, Lock, Trash2, AlertTriangle, Receipt, Upload,
  FileText, Globe, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("store");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingReceiptLogo, setUploadingReceiptLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const receiptLogoInputRef = useRef<HTMLInputElement>(null);

  const [storeForm, setStoreForm] = useState({
    shop_name: "", description: "", slug: "", theme_color: "#22c55e", logo_url: "",
    whatsapp_number: "", address: "", city: "",
  });
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "" });
  const [pwForm, setPwForm] = useState({ newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);

  // Receipt branding form
  const [receiptForm, setReceiptForm] = useState({
    receipt_logo_url: "", receipt_intro_text: "Quality You Can Trust",
    receipt_slogan: "Your Trusted Neighborhood Store",
    receipt_thank_you: "THANK YOU FOR SHOPPING WITH US",
    receipt_paybill: "", receipt_paybill_account: "",
    receipt_till: "", receipt_show_paybill: true,
    receipt_show_till: false, receipt_show_qr: false, receipt_qr_url: "",
  });

  // Legal pages form
  const [legalForm, setLegalForm] = useState({
    privacy_policy: "", terms_of_service: "", refund_policy: "",
  });

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from("shops").select("*").eq("user_id", user.id).order("created_at").limit(1).maybeSingle(),
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (s) {
        setShop(s);
        const shopData = s as any;
        setStoreForm({
          shop_name: s.shop_name || "", description: s.description || "",
          slug: s.slug || "", theme_color: s.theme_color || "#22c55e",
          logo_url: s.logo_url || "",
          whatsapp_number: shopData.whatsapp_number || "",
          address: shopData.address || "", city: shopData.city || "",
        });
        setReceiptForm({
          receipt_logo_url: s.receipt_logo_url || "",
          receipt_intro_text: s.receipt_intro_text || "Quality You Can Trust",
          receipt_slogan: s.receipt_slogan || "Your Trusted Neighborhood Store",
          receipt_thank_you: s.receipt_thank_you || "THANK YOU FOR SHOPPING WITH US",
          receipt_paybill: s.receipt_paybill || "",
          receipt_paybill_account: s.receipt_paybill_account || "",
          receipt_till: s.receipt_till || "",
          receipt_show_paybill: s.receipt_show_paybill ?? true,
          receipt_show_till: s.receipt_show_till ?? false,
          receipt_show_qr: s.receipt_show_qr ?? false,
          receipt_qr_url: s.receipt_qr_url || "",
        });
        setLegalForm({
          privacy_policy: shopData.privacy_policy || "",
          terms_of_service: shopData.terms_of_service || "",
          refund_policy: shopData.refund_policy || "",
        });
      }
      if (p) {
        setProfile(p);
        setProfileForm({ full_name: p.full_name || "", email: user.email || "" });
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const uploadLogoFile = async (file: File, field: "logo_url" | "receipt_logo_url") => {
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Max file size is 5MB", variant: "destructive" }); return; }
    const setter = field === "logo_url" ? setUploadingLogo : setUploadingReceiptLogo;
    setter(true);
    const ext = file.name.split(".").pop();
    const path = `logos/${user!.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setter(false); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    if (field === "logo_url") {
      setStoreForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
    } else {
      setReceiptForm(prev => ({ ...prev, receipt_logo_url: urlData.publicUrl }));
    }
    setter(false);
    toast({ title: "Logo uploaded!" });
  };

  const saveStore = async () => {
    if (!shop) return;
    setSaving("store");
    await supabase.from("shops").update({
      shop_name: storeForm.shop_name,
      description: storeForm.description,
      slug: storeForm.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      theme_color: storeForm.theme_color,
      logo_url: storeForm.logo_url || null,
    } as any).eq("id", shop.id);
    setSaving(null);
    toast({ title: "Store settings saved!" });
  };

  const saveReceipt = async () => {
    if (!shop) return;
    setSaving("receipt");
    await supabase.from("shops").update({
      receipt_logo_url: receiptForm.receipt_logo_url || null,
      receipt_intro_text: receiptForm.receipt_intro_text,
      receipt_slogan: receiptForm.receipt_slogan,
      receipt_thank_you: receiptForm.receipt_thank_you,
      receipt_paybill: receiptForm.receipt_paybill || null,
      receipt_paybill_account: receiptForm.receipt_paybill_account || null,
      receipt_till: receiptForm.receipt_till || null,
      receipt_show_paybill: receiptForm.receipt_show_paybill,
      receipt_show_till: receiptForm.receipt_show_till,
      receipt_show_qr: receiptForm.receipt_show_qr,
      receipt_qr_url: receiptForm.receipt_qr_url || null,
    }).eq("id", shop.id);
    setSaving(null);
    toast({ title: "Receipt branding saved!" });
  };

  const saveLegal = async () => {
    if (!shop) return;
    setSaving("legal");
    await supabase.from("shops").update({
      privacy_policy: legalForm.privacy_policy || null,
      terms_of_service: legalForm.terms_of_service || null,
      refund_policy: legalForm.refund_policy || null,
    } as any).eq("id", shop.id);
    setSaving(null);
    toast({ title: "Legal pages saved!" });
  };

  const saveProfile = async () => {
    setSaving("profile");
    await supabase.from("profiles").update({ full_name: profileForm.full_name }).eq("user_id", user!.id);
    setSaving(null);
    toast({ title: "Profile updated!" });
  };

  const changePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (pwForm.newPw.length < 8) { toast({ title: "Min 8 characters", variant: "destructive" }); return; }
    setSaving("pw");
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setSaving(null);
    if (!error) { toast({ title: "Password changed!" }); setPwForm({ newPw: "", confirm: "" }); }
    else toast({ title: "Error changing password", variant: "destructive" });
  };

  const tabs = [
    { id: "store", label: "Store", icon: Store },
    { id: "receipt", label: "Receipt", icon: Receipt },
    { id: "legal", label: "Legal Pages", icon: FileText },
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "danger", label: "Danger", icon: AlertTriangle },
  ];

  const InputField = ({ label, value, onChange, placeholder, hint, disabled, type = "text" }: any) => (
    <div>
      <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${disabled ? "bg-secondary cursor-not-allowed text-muted-foreground" : ""}`} />
      {hint && <p className="text-xs text-muted-foreground font-body mt-1">{hint}</p>}
    </div>
  );

  const Toggle = ({ label, desc, checked, onChange }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-display font-semibold text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground font-body mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)} className={`w-10 h-5 rounded-full relative transition-colors ${checked ? "bg-primary" : "bg-secondary"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? "right-0.5" : "left-0.5"}`} />
      </button>
    </div>
  );

  const LogoUploadField = ({
    label, hint, value, onChange, uploading, onUpload, inputRef, field
  }: {
    label: string; hint?: string; value: string; onChange: (v: string) => void;
    uploading: boolean; onUpload: (file: File) => void; inputRef: React.RefObject<HTMLInputElement>;
    field: string;
  }) => (
    <div>
      <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</label>
      {value && (
        <div className="relative mb-3 inline-block">
          <img src={value} alt="Logo preview" className="h-16 max-w-[200px] object-contain rounded-xl border border-border bg-secondary p-2" />
          <button onClick={() => onChange("")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent text-accent-foreground font-display font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-60">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "Uploading..." : "Upload Logo"}
        </button>
        <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder="Or paste URL..."
          className="flex-1 px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
        e.target.value = "";
      }} />
      {hint && <p className="text-xs text-muted-foreground font-body mt-1">{hint}</p>}
    </div>
  );

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-xl bg-card border border-border animate-pulse" />
      <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Settings</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Manage your store, receipts, legal pages, profile, and account</p>
      </div>

      <div className="flex gap-1 bg-secondary rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"} ${t.id === "danger" && activeTab !== "danger" ? "text-red-500" : ""}`}>
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      {/* Store */}
      {activeTab === "store" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <Store size={16} className="text-primary" /> Store Information
            </h3>
            <InputField label="Store Name" value={storeForm.shop_name}
              onChange={(v: string) => setStoreForm({ ...storeForm, shop_name: v })} placeholder="My Shop" />
            <InputField label="Store URL Slug" value={storeForm.slug}
              onChange={(v: string) => setStoreForm({ ...storeForm, slug: v })} placeholder="my-shop"
              hint={`Public URL: ${window.location.origin}/store/${storeForm.slug || "your-shop"}`} />
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
              <textarea value={storeForm.description} onChange={e => setStoreForm({ ...storeForm, description: e.target.value })}
                placeholder="What do you sell?" rows={3}
                className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <InputField label="WhatsApp Number" value={storeForm.whatsapp_number}
              onChange={(v: string) => setStoreForm({ ...storeForm, whatsapp_number: v })}
              placeholder="+254712345678" hint="Used for card payment orders and customer contact" />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Address" value={storeForm.address}
                onChange={(v: string) => setStoreForm({ ...storeForm, address: v })} placeholder="e.g. Tom Mboya Street" />
              <InputField label="City" value={storeForm.city}
                onChange={(v: string) => setStoreForm({ ...storeForm, city: v })} placeholder="e.g. Nairobi" />
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <Palette size={16} className="text-primary" /> Branding
            </h3>
            <LogoUploadField
              label="Store Logo"
              hint="Shown in the store header and receipts. Recommended: transparent PNG, min 200x200px"
              value={storeForm.logo_url}
              onChange={(v: string) => setStoreForm({ ...storeForm, logo_url: v })}
              uploading={uploadingLogo}
              onUpload={(file) => uploadLogoFile(file, "logo_url")}
              inputRef={logoInputRef}
              field="logo_url"
            />
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Brand Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={storeForm.theme_color}
                  onChange={e => setStoreForm({ ...storeForm, theme_color: e.target.value })}
                  className="w-12 h-10 rounded-lg border border-input cursor-pointer" />
                <span className="text-sm font-mono text-muted-foreground">{storeForm.theme_color}</span>
                <div className="flex gap-2">
                  {["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map(c => (
                    <button key={c} onClick={() => setStoreForm({ ...storeForm, theme_color: c })}
                      className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                      style={{ backgroundColor: c, borderColor: storeForm.theme_color === c ? "#000" : "transparent" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={saveStore} disabled={saving === "store"}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-60">
            {saving === "store" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Store Settings
          </button>
        </motion.div>
      )}

      {/* Receipt & Branding */}
      {activeTab === "receipt" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <Receipt size={16} className="text-primary" /> Receipt Branding
            </h3>
            <p className="text-xs text-muted-foreground font-body">Customize how your receipts look — logos, slogans, payment info.</p>
            <LogoUploadField
              label="Receipt Logo"
              hint="Appears at the top of printed receipts. Recommended: square logo, min 100x100px"
              value={receiptForm.receipt_logo_url}
              onChange={(v: string) => setReceiptForm({ ...receiptForm, receipt_logo_url: v })}
              uploading={uploadingReceiptLogo}
              onUpload={(file) => uploadLogoFile(file, "receipt_logo_url")}
              inputRef={receiptLogoInputRef}
              field="receipt_logo_url"
            />
            <InputField label="Intro Text" value={receiptForm.receipt_intro_text}
              onChange={(v: string) => setReceiptForm({ ...receiptForm, receipt_intro_text: v })}
              placeholder="Quality You Can Trust" />
            <InputField label="Slogan" value={receiptForm.receipt_slogan}
              onChange={(v: string) => setReceiptForm({ ...receiptForm, receipt_slogan: v })}
              placeholder="Your Trusted Neighborhood Store" />
            <InputField label="Thank You Message" value={receiptForm.receipt_thank_you}
              onChange={(v: string) => setReceiptForm({ ...receiptForm, receipt_thank_you: v })}
              placeholder="THANK YOU FOR SHOPPING WITH US" />
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-display font-bold text-foreground">M-Pesa Payment Details</h3>
            <p className="text-xs text-muted-foreground font-body">These appear on receipts and in the POS payment screen.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Paybill Number" value={receiptForm.receipt_paybill}
                onChange={(v: string) => setReceiptForm({ ...receiptForm, receipt_paybill: v })} placeholder="e.g. 123456" />
              <InputField label="Account Number" value={receiptForm.receipt_paybill_account}
                onChange={(v: string) => setReceiptForm({ ...receiptForm, receipt_paybill_account: v })} placeholder="e.g. Store Name" />
            </div>
            <InputField label="Till Number (Buy Goods)" value={receiptForm.receipt_till}
              onChange={(v: string) => setReceiptForm({ ...receiptForm, receipt_till: v })} placeholder="e.g. 543210" />
            <Toggle label="Show Paybill on Receipt" checked={receiptForm.receipt_show_paybill}
              onChange={(v: boolean) => setReceiptForm({ ...receiptForm, receipt_show_paybill: v })} />
            <Toggle label="Show Till on Receipt" checked={receiptForm.receipt_show_till}
              onChange={(v: boolean) => setReceiptForm({ ...receiptForm, receipt_show_till: v })} />
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-display font-bold text-foreground">QR Code (Optional)</h3>
            <Toggle label="Show QR Code on Receipt" desc="Links to your online store or Google Reviews"
              checked={receiptForm.receipt_show_qr}
              onChange={(v: boolean) => setReceiptForm({ ...receiptForm, receipt_show_qr: v })} />
            {receiptForm.receipt_show_qr && (
              <InputField label="QR Code URL" value={receiptForm.receipt_qr_url}
                onChange={(v: string) => setReceiptForm({ ...receiptForm, receipt_qr_url: v })}
                placeholder="https://your-store.com or Google review link" />
            )}
          </div>

          <button onClick={saveReceipt} disabled={saving === "receipt"}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-60">
            {saving === "receipt" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Receipt Settings
          </button>
        </motion.div>
      )}

      {/* Legal Pages */}
      {activeTab === "legal" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
              <FileText size={16} className="text-primary" /> Legal Pages
            </h3>
            <p className="text-xs text-muted-foreground font-body mb-5">
              These pages appear in your public store footer. Write in plain text or Markdown.
            </p>
            <div className="space-y-5">
              {[
                { key: "privacy_policy", label: "Privacy Policy", placeholder: "Describe how you collect and use customer data..." },
                { key: "terms_of_service", label: "Terms of Service", placeholder: "Outline the terms customers agree to when using your store..." },
                { key: "refund_policy", label: "Refund & Returns Policy", placeholder: "Explain your refund and exchange policy..." },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{f.label}</label>
                  <textarea
                    value={legalForm[f.key as keyof typeof legalForm]}
                    onChange={e => setLegalForm({ ...legalForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                  />
                  {legalForm[f.key as keyof typeof legalForm] && (
                    <p className="text-xs text-primary font-body mt-1">
                      ✓ {legalForm[f.key as keyof typeof legalForm].length} characters — will appear in store footer
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveLegal} disabled={saving === "legal"}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-60">
            {saving === "legal" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Legal Pages
          </button>
        </motion.div>
      )}

      {/* Profile */}
      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 border border-border space-y-4">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <User size={16} className="text-primary" /> Profile
          </h3>
          <InputField label="Full Name" value={profileForm.full_name}
            onChange={(v: string) => setProfileForm({ ...profileForm, full_name: v })} placeholder="Your name" />
          <InputField label="Email" value={profileForm.email} onChange={() => {}} disabled hint="Email cannot be changed" />
          <div className="p-4 rounded-xl bg-accent">
            <p className="text-xs font-display font-semibold text-foreground">
              Plan: <span className="text-primary capitalize">{profile?.plan || "Trial"}</span>
            </p>
            {profile?.trial_ends_at && (
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Trial ends: {new Date(profile.trial_ends_at).toLocaleDateString("en-KE")}
              </p>
            )}
          </div>
          <button onClick={saveProfile} disabled={saving === "profile"}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-60">
            {saving === "profile" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Profile
          </button>
        </motion.div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 border border-border space-y-4">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <Lock size={16} className="text-primary" /> Change Password
          </h3>
          {[{ label: "New Password", key: "newPw" }, { label: "Confirm Password", key: "confirm" }].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{f.label}</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"}
                  value={pwForm[f.key as keyof typeof pwForm]}
                  onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                  placeholder="••••••••" minLength={8}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <button onClick={changePassword} disabled={saving === "pw"}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-60">
            {saving === "pw" ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />} Update Password
          </button>
        </motion.div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 border border-border space-y-1">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-3">
            <Bell size={16} className="text-primary" /> Notifications
          </h3>
          {[
            { label: "New order alerts", desc: "Get notified on new orders" },
            { label: "Payment confirmations", desc: "M-Pesa success notifications" },
            { label: "Low stock alerts", desc: "When stock falls below 5" },
            { label: "Weekly summary", desc: "Weekly revenue email" },
          ].map((n, i) => <Toggle key={i} label={n.label} desc={n.desc} checked={true} onChange={() => {}} />)}
        </motion.div>
      )}

      {/* Danger */}
      {activeTab === "danger" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 border border-red-500/30 space-y-4">
          <h3 className="font-display font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle size={16} /> Danger Zone
          </h3>
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-500/20">
            <p className="font-display font-semibold text-sm text-foreground mb-1">Delete Account</p>
            <p className="text-xs text-muted-foreground font-body mb-3">
              Permanently deletes your account, store, products, and all data. This cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-display font-semibold text-sm hover:bg-red-600 flex items-center gap-2">
                <Trash2 size={14} /> Delete My Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-display font-semibold text-red-500">Are you absolutely sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-secondary text-foreground font-display font-semibold text-sm">Cancel</button>
                  <button onClick={signOut}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-display font-semibold text-sm hover:bg-red-600">
                    Yes, delete everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SettingsPage;
