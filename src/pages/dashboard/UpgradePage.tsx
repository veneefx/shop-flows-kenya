import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Zap, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Starter",
    price: 1499,
    period: "/ month",
    tagline: "For small kiosks & solo vendors",
    features: ["Up to 30 products", "Basic POS terminal", "M-Pesa payments", "Order management", "WhatsApp receipts", "Email support"],
    color: "border-border",
    highlight: false,
  },
  {
    name: "Business",
    price: 3499,
    period: "/ month",
    tagline: "Launch your online store",
    badge: "Most Popular",
    features: ["Unlimited products", "Public store link", "Advanced analytics", "Coupon & discounts", "Credit management", "Staff accounts", "CSV export", "Priority support"],
    color: "border-primary",
    highlight: true,
  },
  {
    name: "Professional",
    price: 9999,
    period: "/ month",
    tagline: "For growing retail businesses",
    features: ["Everything in Business", "Offline POS mode", "Hardware integration", "Promotions engine", "Delivery tracking", "Multi-location support", "Custom branding", "WhatsApp alerts"],
    color: "border-border",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: 30000,
    period: "/ month",
    tagline: "For large-scale operations",
    features: ["Everything in Professional", "Multi-user access", "Multi-shop management", "API access", "Activity logs & audit", "Custom features", "Dedicated support manager", "White-label options"],
    color: "border-border",
    highlight: false,
  },
];

const UpgradePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setProfile(p);
      setSubscription(s);
      setLoading(false);
    };
    init();
  }, [user]);

  const handleUpgrade = async () => {
    if (!selectedPlan) { toast({ title: "Select a plan", variant: "destructive" }); return; }
    const plan = plans.find(p => p.name === selectedPlan)!;
    setSubmitting(true);
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user!.id, plan: selectedPlan.toLowerCase(), status: "pending",
      amount: plan.price, payment_proof: proofUrl || null,
    });
    setSubmitting(false);
    if (!error) {
      toast({ title: "Upgrade request submitted!", description: "Admin will review and activate your plan within 24 hours." });
      setSelectedPlan(null); setProofUrl("");
    } else {
      toast({ title: "Error submitting request", variant: "destructive" });
    }
  };

  if (loading) return <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />;

  const currentPlan = profile?.plan || "trial";
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const trialActive = trialEnds ? trialEnds > new Date() : false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Upgrade Plan</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Choose the perfect plan for your business size</p>
      </div>

      {/* Current plan banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-primary/10 border border-primary/30 p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Crown size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold text-foreground capitalize">Current Plan: {currentPlan}</p>
          {trialActive && trialEnds && (
            <p className="text-sm text-muted-foreground font-body flex items-center gap-1 mt-0.5">
              <Clock size={12} /> Trial ends {trialEnds.toLocaleDateString("en-KE")}
            </p>
          )}
          {subscription && subscription.status === "pending" && (
            <p className="text-sm text-orange-500 font-body flex items-center gap-1 mt-0.5">
              <AlertCircle size={12} /> Upgrade request pending admin approval
            </p>
          )}
        </div>
      </motion.div>

      {/* Plan cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map((plan, i) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            onClick={() => setSelectedPlan(selectedPlan === plan.name ? null : plan.name)}
            className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 ${
              selectedPlan === plan.name ? "border-primary shadow-brand scale-[1.02]" : plan.color
            } bg-card`}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-display font-bold shadow-brand">
                  <Zap size={10} fill="currentColor" /> {plan.badge}
                </span>
              </div>
            )}
            {selectedPlan === plan.name && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
            )}
            <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">{plan.tagline}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">KSh</span>
              <span className="font-display font-black text-2xl text-foreground">{plan.price.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground font-body">{plan.period}</span>
            </div>
            <ul className="mt-4 space-y-1.5">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-primary" strokeWidth={3} />
                  </div>
                  <span className="text-xs text-foreground font-body">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Payment instructions + submit */}
      {selectedPlan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border border-border space-y-4">
          <h3 className="font-display font-bold text-foreground">Complete Your Upgrade</h3>
          <div className="p-4 rounded-xl bg-accent space-y-2">
            <p className="font-display font-semibold text-sm text-foreground">Payment Instructions</p>
            <p className="text-sm text-foreground font-body">1. Send <strong>KSh {plans.find(p => p.name === selectedPlan)?.price.toLocaleString()}</strong> via M-Pesa to <strong>+254 111 944 791</strong></p>
            <p className="text-sm text-foreground font-body">2. Use your email as the reference/narration</p>
            <p className="text-sm text-foreground font-body">3. Screenshot the M-Pesa confirmation and paste the URL below (optional)</p>
            <p className="text-sm text-foreground font-body">4. Submit — admin activates within 24hrs</p>
          </div>
          <div>
            <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Payment Proof URL (Optional)</label>
            <input value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="https://screenshot-url or leave blank"
              className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={handleUpgrade} disabled={submitting}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 transition-all disabled:opacity-60">
            {submitting ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <ArrowRight size={16} />}
            Submit Upgrade Request — {selectedPlan}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default UpgradePage;
