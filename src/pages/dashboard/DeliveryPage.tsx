import { Truck, Package, MapPin, Clock } from "lucide-react";

const DeliveryPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Delivery</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Manage deliveries, riders, and tracking</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: Truck, label: "Active Deliveries", value: "0", color: "text-primary", bg: "bg-accent" },
          { icon: Package, label: "Pending", value: "0", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
          { icon: MapPin, label: "Completed", value: "0", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { icon: Clock, label: "Avg Time", value: "—", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
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
        <Truck size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="font-display font-semibold text-foreground">Delivery module</p>
        <p className="text-sm text-muted-foreground font-body mt-1">Assign riders, track deliveries, manage courier operations</p>
        <p className="text-xs text-primary font-display font-semibold mt-3">Coming soon →</p>
      </div>
    </div>
  );
};

export default DeliveryPage;
