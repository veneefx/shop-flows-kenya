import { motion } from "framer-motion";
import { Wallet, Users, AlertCircle, Clock } from "lucide-react";

const CreditPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Credit Management</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Track customer credit balances and outstanding payments</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Credit Customers", value: "0", color: "text-primary", bg: "bg-accent" },
          { icon: Wallet, label: "Outstanding Balance", value: "KSh 0", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
          { icon: AlertCircle, label: "Overdue Payments", value: "0", color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
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

      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Wallet size={28} className="text-muted-foreground" />
        </div>
        <p className="font-display font-semibold text-foreground">No credit accounts yet</p>
        <p className="text-sm text-muted-foreground font-body mt-1">Credit sales from POS will appear here for tracking</p>
      </div>
    </div>
  );
};

export default CreditPage;
