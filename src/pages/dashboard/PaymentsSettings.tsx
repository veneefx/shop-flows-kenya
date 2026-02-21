import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Save, CheckCircle, Key, Webhook, ExternalLink, Info, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PaymentsSettings = () => {
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [keys, setKeys] = useState({
    lipana_publishable_key: "",
    lipana_secret_key: "",
    lipana_webhook_secret: "",
  });

  const [show, setShow] = useState({
    lipana_publishable_key: false,
    lipana_secret_key: false,
    lipana_webhook_secret: false,
  });

  useEffect(() => {
    if (!user) return;
    const fetchShop = async () => {
      const { data } = await supabase
        .from("shops")
        .select("id, lipana_publishable_key, lipana_secret_key, lipana_webhook_secret")
        .eq("user_id", user.id)
        .order("created_at")
        .limit(1)
        .maybeSingle();

      if (data) {
        setShopId(data.id);
        setKeys({
          lipana_publishable_key: data.lipana_publishable_key || "",
          lipana_secret_key: data.lipana_secret_key || "",
          lipana_webhook_secret: data.lipana_webhook_secret || "",
        });
      }
      setLoading(false);
    };
    fetchShop();
  }, [user]);

  const handleSave = async () => {
    if (!shopId) {
      setError("No shop found. Please set up your shop first.");
      return;
    }
    setSaving(true);
    setError("");

    const { error: err } = await supabase
      .from("shops")
      .update({
        lipana_publishable_key: keys.lipana_publishable_key.trim() || null,
        lipana_secret_key: keys.lipana_secret_key.trim() || null,
        lipana_webhook_secret: keys.lipana_webhook_secret.trim() || null,
      })
      .eq("id", shopId);

    setSaving(false);
    if (err) {
      setError("Failed to save. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const toggleShow = (field: keyof typeof show) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const webhookUrl = `https://hiwphnopnzzrkcqvlces.supabase.co/functions/v1/lipana-webhook`;

  const fields = [
    {
      key: "lipana_publishable_key" as const,
      label: "Publishable Key",
      description: "Safe to use in client-side code. Starts with lip_pk_live_...",
      placeholder: "lip_pk_live_...",
      icon: Key,
      sensitive: false,
    },
    {
      key: "lipana_secret_key" as const,
      label: "Secret Key",
      description: "Keep private. Only used server-side. Never expose in public code. Starts with lip_sk_live_...",
      placeholder: "lip_sk_live_...",
      icon: Key,
      sensitive: true,
    },
    {
      key: "lipana_webhook_secret" as const,
      label: "Webhook Secret",
      description: "Used to verify webhook signatures from Lipana. Found in your Lipana dashboard under Webhooks.",
      placeholder: "Your webhook secret...",
      icon: Webhook,
      sensitive: true,
    },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">
          Payment Settings
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Connect your Lipana M-Pesa account to accept payments.
        </p>
      </div>

      {/* Docs link */}
      <motion.a
        href="https://api.lipana.dev"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-accent border border-primary/20 hover:border-primary/40 transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Info size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm text-foreground">Lipana Documentation</p>
          <p className="text-xs text-muted-foreground font-body">
            Get your API keys from lipana.dev dashboard → API Keys
          </p>
        </div>
        <ExternalLink size={16} className="text-primary group-hover:translate-x-0.5 transition-transform" />
      </motion.a>

      {/* Webhook URL info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl bg-card border border-border"
      >
        <div className="flex items-start gap-3 mb-3">
          <Webhook size={18} className="text-primary mt-0.5" />
          <div>
            <p className="font-display font-semibold text-sm text-foreground">Your Webhook URL</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Add this URL in your Lipana dashboard under Webhooks → Add Endpoint
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-background rounded-xl px-4 py-3 border border-border">
          <code className="text-xs font-mono text-primary flex-1 break-all">
            {webhookUrl}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(webhookUrl)}
            className="flex-shrink-0 text-xs font-display font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
          >
            Copy
          </button>
        </div>
        <div className="mt-3 flex items-start gap-2">
          <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground font-body">
            Lipana will send payment events to this URL. Make sure it's set in your Lipana dashboard along with the Webhook Secret below.
          </p>
        </div>
      </motion.div>

      {/* Key fields */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, i) => {
            const Icon = field.icon;
            const isVisible = show[field.key];
            return (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="bg-card rounded-2xl p-5 border border-border"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={15} className="text-primary" />
                  </div>
                  <div>
                    <label className="font-display font-semibold text-sm text-foreground block">
                      {field.label}
                    </label>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{field.description}</p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={field.sensitive && !isVisible ? "password" : "text"}
                    value={keys[field.key]}
                    onChange={(e) => setKeys({ ...keys, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-background border border-input text-sm font-mono text-foreground placeholder:text-muted-foreground placeholder:font-body focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {field.sensitive && (
                    <button
                      type="button"
                      onClick={() => toggleShow(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Save */}
      {error && (
        <p className="text-sm text-destructive font-body">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || loading}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all disabled:opacity-60"
      >
        {saved ? (
          <>
            <CheckCircle size={16} />
            Saved!
          </>
        ) : saving ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
            Saving...
          </>
        ) : (
          <>
            <Save size={16} />
            Save Settings
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground font-body -mt-4">
        🔒 Keys are encrypted and stored securely. Never share your secret key publicly.
      </p>
    </div>
  );
};

export default PaymentsSettings;
