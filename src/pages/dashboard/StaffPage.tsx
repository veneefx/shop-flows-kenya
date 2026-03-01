import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, Users, Clock, Shield, Plus, X, Phone, Mail, Briefcase } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: "owner" | "manager" | "cashier" | "storekeeper";
  status: "active" | "inactive";
  clockedIn: boolean;
}

const roles = [
  { key: "owner", label: "Owner", desc: "Full system access", color: "border-primary/50 bg-primary/5", icon: "👑" },
  { key: "manager", label: "Manager", desc: "Manage inventory, orders, staff", color: "border-blue-500/50 bg-blue-500/5", icon: "🛡️" },
  { key: "cashier", label: "Cashier", desc: "POS sales only", color: "border-orange-500/50 bg-orange-500/5", icon: "💰" },
  { key: "storekeeper", label: "Storekeeper", desc: "Inventory management only", color: "border-purple-500/50 bg-purple-500/5", icon: "📦" },
];

const StaffPage = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "cashier" });
  const [activeTab, setActiveTab] = useState<"team" | "roles" | "attendance">("team");

  const handleAdd = () => {
    if (!form.name || !form.phone) return;
    setStaff(prev => [...prev, {
      id: Date.now().toString(),
      name: form.name,
      phone: form.phone,
      email: form.email,
      role: form.role as StaffMember["role"],
      status: "active",
      clockedIn: false,
    }]);
    setForm({ name: "", phone: "", email: "", role: "cashier" });
    setShowForm(false);
  };

  const toggleClock = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, clockedIn: !s.clockedIn } : s));
  };

  const removeStaff = (id: string) => {
    if (confirm("Remove this staff member?")) setStaff(prev => prev.filter(s => s.id !== id));
  };

  const clockedIn = staff.filter(s => s.clockedIn).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl lg:text-3xl text-foreground">Staff Management</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">Manage employees, roles & attendance</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Total Staff", value: String(staff.length), color: "text-primary", bg: "bg-accent" },
          { icon: Shield, label: "Active Roles", value: String(new Set(staff.map(s => s.role)).size || 0), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { icon: Clock, label: "Clocked In", value: String(clockedIn), color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {[["team", "Team"], ["roles", "Roles"], ["attendance", "Attendance"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
            className={`px-4 py-2.5 text-sm font-display font-semibold rounded-t-xl transition-all ${activeTab === key ? "bg-card border border-border border-b-card text-foreground -mb-px" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Team tab */}
      {activeTab === "team" && (
        <>
          {staff.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <UserCog size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-display font-semibold text-foreground">No staff added yet</p>
              <p className="text-sm text-muted-foreground font-body mt-1">Add employees and assign roles</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border p-5 relative group">
                  <button onClick={() => removeStaff(s.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all">
                    <X size={14} />
                  </button>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="font-display font-bold text-primary text-lg">{s.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm text-foreground">{s.name}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-display font-semibold capitalize ${
                        s.role === "owner" ? "bg-primary/10 text-primary" :
                        s.role === "manager" ? "bg-blue-500/10 text-blue-500" :
                        s.role === "cashier" ? "bg-orange-500/10 text-orange-500" :
                        "bg-purple-500/10 text-purple-500"
                      }`}>{s.role}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground font-body">
                    <p className="flex items-center gap-1.5"><Phone size={11} />{s.phone}</p>
                    {s.email && <p className="flex items-center gap-1.5"><Mail size={11} />{s.email}</p>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className={`text-xs font-display font-semibold ${s.clockedIn ? "text-primary" : "text-muted-foreground"}`}>
                      {s.clockedIn ? "● Clocked In" : "○ Clocked Out"}
                    </span>
                    <button onClick={() => toggleClock(s.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-display font-semibold transition-all ${s.clockedIn ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                      {s.clockedIn ? "Clock Out" : "Clock In"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Roles tab */}
      {activeTab === "roles" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {roles.map(r => (
            <div key={r.key} className={`rounded-2xl border p-5 ${r.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{r.icon}</span>
                <p className="font-display font-bold text-foreground">{r.label}</p>
              </div>
              <p className="text-sm text-muted-foreground font-body">{r.desc}</p>
              <p className="text-xs text-muted-foreground font-body mt-2">{staff.filter(s => s.role === r.key).length} members</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance tab */}
      {activeTab === "attendance" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {staff.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={28} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-body">Add staff to track attendance</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-border bg-secondary/50">
                {["Name", "Role", "Status", "Action"].map(h => (
                  <p key={h} className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
                ))}
              </div>
              {staff.map(s => (
                <div key={s.id} className="grid grid-cols-4 gap-4 items-center px-5 py-3 border-b border-border last:border-0">
                  <p className="text-sm font-display font-semibold text-foreground">{s.name}</p>
                  <span className="text-xs text-muted-foreground font-body capitalize">{s.role}</span>
                  <span className={`text-xs font-display font-semibold ${s.clockedIn ? "text-primary" : "text-muted-foreground"}`}>
                    {s.clockedIn ? "● In" : "○ Out"}
                  </span>
                  <button onClick={() => toggleClock(s.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-display font-semibold w-fit transition-all ${s.clockedIn ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
                    {s.clockedIn ? "Clock Out" : "Clock In"}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-foreground">Add Staff Member</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              {[
                { label: "Full Name *", key: "name", placeholder: "e.g. Jane Wanjiku" },
                { label: "Phone *", key: "phone", placeholder: "0712345678" },
                { label: "Email", key: "email", placeholder: "jane@email.com (optional)" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{f.label}</label>
                  <input value={form[f.key as keyof typeof form]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-display font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map(r => (
                    <button key={r.key} onClick={() => setForm({ ...form, role: r.key })}
                      className={`p-3 rounded-xl border text-left transition-all ${form.role === r.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <span className="text-lg">{r.icon}</span>
                      <p className="font-display font-semibold text-xs text-foreground mt-1">{r.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleAdd}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:opacity-90 flex items-center justify-center gap-2">
                <Plus size={16} /> Add Staff Member
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffPage;
