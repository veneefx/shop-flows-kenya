import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, ShoppingBag, Package, User, Settings, Search, Filter, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LogEntry {
  id: string;
  event_type: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  message: string;
  metadata: any;
  created_at: string;
  actor_user_id: string | null;
}

const eventIcons: Record<string, any> = {
  order: ShoppingBag,
  product: Package,
  inventory: Package,
  login: User,
  permission: Settings,
};

const eventColors: Record<string, string> = {
  order: "text-blue-500 bg-blue-500/10",
  product: "text-purple-500 bg-purple-500/10",
  inventory: "text-orange-500 bg-orange-500/10",
  login: "text-primary bg-accent",
  permission: "text-red-500 bg-red-500/10",
};

const ActivityLogsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: shop } = await supabase.from("shops").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
      if (shop) {
        setShopId(shop.id);
        await fetchLogs(shop.id);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!shopId) return;
    const channel = supabase
      .channel("activity-logs-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs", filter: `shop_id=eq.${shopId}` }, (payload) => {
        setLogs(prev => [payload.new as LogEntry, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shopId]);

  const fetchLogs = async (sid: string) => {
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("shop_id", sid)
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs((data as LogEntry[]) || []);
  };

  const refresh = () => {
    if (shopId) { setLoading(true); fetchLogs(shopId).then(() => setLoading(false)); }
  };

  const filters = ["all", "order", "product", "inventory", "login", "permission"];
  const filtered = logs.filter(l => {
    if (filter !== "all" && l.event_type !== filter) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{logs.length} events tracked · Real-time updates</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-sm font-display font-semibold text-muted-foreground hover:text-foreground transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activity..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-display font-semibold capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Activity size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-display font-semibold text-foreground">No activity {filter !== "all" ? `for "${filter}"` : ""} yet</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Events will appear here in real-time as your store operates</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log, i) => {
            const Icon = eventIcons[log.event_type] || Activity;
            const color = eventColors[log.event_type] || "text-muted-foreground bg-secondary";
            const [iconColor, iconBg] = color.split(" ");
            return (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/20 transition-all">
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={14} className={iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body text-foreground leading-snug">{log.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-display font-semibold uppercase tracking-wide ${iconColor}`}>{log.event_type}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground font-body">{log.action}</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-body flex-shrink-0 mt-0.5">{formatTime(log.created_at)}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityLogsPage;
