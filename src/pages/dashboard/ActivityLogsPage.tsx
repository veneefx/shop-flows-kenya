import { Activity, User, Package, ShoppingBag, Settings } from "lucide-react";

const ActivityLogsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Track all system activity and changes</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display font-bold text-foreground mb-4">What's tracked</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: ShoppingBag, label: "Sales & Order Edits", desc: "Order status changes, cancellations" },
            { icon: Package, label: "Stock Changes", desc: "Product additions, stock adjustments" },
            { icon: User, label: "Login History", desc: "User login/logout events" },
            { icon: Settings, label: "Permission Changes", desc: "Role and permission updates" },
          ].map(f => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-secondary">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <Activity size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="font-display font-semibold text-foreground">No activity recorded yet</p>
        <p className="text-sm text-muted-foreground font-body mt-1">Activity logs will appear here as users interact with the system</p>
      </div>
    </div>
  );
};

export default ActivityLogsPage;
