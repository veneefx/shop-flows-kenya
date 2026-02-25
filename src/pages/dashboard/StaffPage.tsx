import { motion } from "framer-motion";
import { UserCog, Users, Clock, Shield } from "lucide-react";

const StaffPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Staff Management</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Manage employees, roles, permissions & attendance</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Total Staff", value: "0", color: "text-primary", bg: "bg-accent" },
          { icon: Shield, label: "Active Roles", value: "3", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { icon: Clock, label: "Clocked In", value: "0", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
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

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-bold text-foreground mb-4">Available Roles</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { role: "Owner", desc: "Full system access", color: "border-primary/50 bg-primary/5" },
            { role: "Manager", desc: "Manage inventory, orders, staff", color: "border-blue-500/50 bg-blue-500/5" },
            { role: "Cashier", desc: "POS sales only", color: "border-orange-500/50 bg-orange-500/5" },
          ].map(r => (
            <div key={r.role} className={`rounded-xl border p-4 ${r.color}`}>
              <p className="font-display font-bold text-sm text-foreground">{r.role}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-12 bg-card rounded-2xl border border-border">
        <UserCog size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="font-display font-semibold text-foreground">No staff added yet</p>
        <p className="text-sm text-muted-foreground font-body mt-1">Add employees and assign roles to get started</p>
      </div>
    </div>
  );
};

export default StaffPage;
