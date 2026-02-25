import { Megaphone, Tag, Zap, Gift } from "lucide-react";

const PromotionsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Promotions</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Create discounts, bundles, and flash sales</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Tag, label: "Active Discounts", value: "0", color: "text-primary", bg: "bg-accent" },
          { icon: Gift, label: "Bundle Offers", value: "0", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
          { icon: Zap, label: "Flash Sales", value: "0", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl p-5 border border-border">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="font-display font-black text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { title: "Discount Rules", desc: "Create percentage or fixed amount discounts", icon: Tag },
          { title: "Bundle Offers", desc: "Combine products into special packages", icon: Gift },
          { title: "Flash Sales", desc: "Time-limited deals to boost sales", icon: Zap },
          { title: "Coupon Codes", desc: "Generate shareable coupon codes", icon: Megaphone },
        ].map(f => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="bg-card rounded-2xl border border-border p-5 hover:border-primary/40 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3">
                <Icon size={18} className="text-primary" />
              </div>
              <p className="font-display font-bold text-sm text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{f.desc}</p>
              <p className="text-xs text-primary font-display font-semibold mt-2">Coming soon →</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PromotionsPage;
