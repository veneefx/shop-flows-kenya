import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings, Store, Globe, Palette, Bell, Shield,
  Save, Upload, Eye, EyeOff, CheckCircle, Loader2, Mail, Phone,
  User, Lock, CreditCard, Trash2, AlertTriangle
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

  const [storeForm, setStoreForm] = useState({ shop_name: "", description: "", slug: "", theme_color: "#22c55e", logo_url: "" });
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "" });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from("shops").select("*").eq("user_id", user.id).single(),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      ]);
      if (s) { setShop(s); setStoreForm({ shop_name: s.shop_name || "", description: s.description || "", slug: s.slug || "", theme_color: s.theme_color || "#22c55e", logo_url: s.logo_url || "" }); }
      if (p) { setProfile(p); setProfileForm({ full_name: p.full_name || "", email: user.email || "" }); }
      setLoading(false);
    };
    init();
  }, [user]);

  const saveStore = async () => {
    if (!shop) return;
    setSaving("store");
    const { error } = await supabase.from("shops").update({
      shop_name: storeForm.shop_name, description: storeForm.description,
      slug: storeForm.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      theme_color: storeForm.theme_color, logo_url: storeForm.logo_url || null,
    }).eq("id", shop.id);
    setSaving(null);
    if (!error) toast({ title: "Store settings saved!" });
    else toast({ title: "Error saving", variant: "destructive" });
  };

  const saveProfile = async () => {
    setSaving("profile");
    await supabase.from("profiles").update({ full_name: profileForm.full_name }).eq("user_id", user!.id);
    setSaving(null);
    toast({ title: "Profile updated!" });
  };

  const changePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (pwForm.newPw.length < 8) { toast({ title: "Password too short (min 8 chars)", variant: "destructive" }); return; }
    setSaving("pw");
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setSaving(null);
    if (!error) { toast({ title: "Password changed!" }); setPwForm({ current: "", newPw: "", confirm: "" }); }
    else toast({ title: "Error changing password", variant: "destructive" });
  };

  const tabs = [
    { id: "store", label: "Store", icon: Store },
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

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
        <p className="text-muted-foreground font-body text-sm mt-1">Manage your store, profile, and account settings</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display font-semibold whitespace-nowrap transition-all ${
                activeTab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              } ${t.id === "danger" && activeTab !== "danger" ? "text-red-500 hover:text-red-600" : ""}`}>
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Store Settings */}
      {activeTab === "store" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Store size={16} className="text-primary" />Store Information</h3>
            {[
              { label: "Store Name", key: "shop_name", placeholder: "My Awesome Shop" },
              { label: "Store URL Slug", key: "slug", placeholder: "my-shop", hint: `Public URL: /store/${storeForm.slug || "your-shop"}` },
              { label: "Logo URL", key: "logo_url", placeholder: "https://..." },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{f.label}</label>
                <input value={storeForm[f.key as keyof typeof storeForm]}
                  onChange={e => setStoreForm({ ...storeForm, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                {f.hint && <p className="text-xs text-muted-foreground font-body mt-1">{f.hint}</p>}
              </div>
            ))}
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
              <textarea value={storeForm.description} onChange={e => setStoreForm({ ...storeForm, description: e.target.value })}
                placeholder="What do you sell?" rows={3}
                className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Brand Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={storeForm.theme_color}
                  onChange={e => setStoreForm({ ...storeForm, theme_color: e.target.value })}
                  className="w-12 h-10 rounded-lg border border-input cursor-pointer" />
                <span className="text-sm font-mono text-muted-foreground">{storeForm.theme_color}</span>
              </div>
            </div>
            <button onClick={saveStore} disabled={saving === "store"}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all disabled:opacity-60">
              {saving === "store" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving === "store" ? "Saving..." : "Save Store Settings"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Profile Settings */}
      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2"><User size={16} className="text-primary" />Profile Information</h3>
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Full Name</label>
              <input value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                placeholder="Your name" className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Email Address</label>
              <input value={profileForm.email} disabled
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-input text-sm font-body text-muted-foreground cursor-not-allowed" />
              <p className="text-xs text-muted-foreground font-body mt-1">Email cannot be changed</p>
            </div>
            <div className="p-4 rounded-xl bg-accent">
              <p className="text-xs font-display font-semibold text-foreground">Plan: <span className="text-primary capitalize">{profile?.plan || "Trial"}</span></p>
              {profile?.trial_ends_at && <p className="text-xs text-muted-foreground font-body mt-0.5">Trial ends: {new Date(profile.trial_ends_at).toLocaleDateString("en-KE")}</p>}
            </div>
            <button onClick={saveProfile} disabled={saving === "profile"}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all disabled:opacity-60">
              {saving === "profile" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Profile
            </button>
          </div>
        </motion.div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Lock size={16} className="text-primary" />Change Password</h3>
            {[
              { label: "New Password", key: "newPw" },
              { label: "Confirm Password", key: "confirm" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{f.label}</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"}
                    value={pwForm[f.key as keyof typeof pwForm]}
                    onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                    placeholder="••••••••" minLength={8}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
            <button onClick={changePassword} disabled={saving === "pw"}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all disabled:opacity-60">
              {saving === "pw" ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
              Update Password
            </button>
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Bell size={16} className="text-primary" />Notification Preferences</h3>
            {[
              { label: "New order alerts", desc: "Get notified when a customer places an order" },
              { label: "Payment confirmations", desc: "M-Pesa payment success notifications" },
              { label: "Low stock alerts", desc: "Notified when product stock falls below 5" },
              { label: "Weekly summary", desc: "Weekly revenue and order summary email" },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">{n.desc}</p>
                </div>
                <div className="w-10 h-5 rounded-full bg-primary relative cursor-pointer">
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Danger Zone */}
      {activeTab === "danger" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card rounded-2xl p-6 border border-red-500/30 space-y-4">
            <h3 className="font-display font-bold text-red-500 flex items-center gap-2"><AlertTriangle size={16} />Danger Zone</h3>
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-500/20">
              <p className="font-display font-semibold text-sm text-foreground mb-1">Delete Account</p>
              <p className="text-xs text-muted-foreground font-body mb-3">This will permanently delete your account, store, products, and all data. This cannot be undone.</p>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 rounded-xl bg-red-500 text-white font-display font-semibold text-sm hover:bg-red-600 transition-all flex items-center gap-2">
                  <Trash2 size={14} /> Delete My Account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-display font-semibold text-red-500">Are you absolutely sure?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl bg-secondary text-foreground font-display font-semibold text-sm hover:bg-accent transition-all">Cancel</button>
                    <button onClick={signOut} className="px-4 py-2 rounded-xl bg-red-500 text-white font-display font-semibold text-sm hover:bg-red-600 transition-all">Yes, delete everything</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SettingsPage;
