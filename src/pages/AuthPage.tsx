import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/logo.png";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        setSuccess("Account created! Check your email to verify your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-brand">
              <img src={logoImg} alt="Vee Digital" className="w-7 h-7 object-contain" />
            </div>
            <div className="text-left">
              <span className="font-display font-bold text-xl text-white block leading-none">Vee Digital</span>
              <span className="text-white/40 text-xs font-body">Solutions</span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-dark rounded-3xl p-8 border border-white/10">
          {/* Mode Toggle */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-8">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-display font-semibold transition-all duration-200 ${
                  mode === m
                    ? "bg-primary text-primary-foreground shadow-brand"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h1 className="font-display font-black text-2xl text-white">
              {mode === "login" ? "Welcome back" : "Start your free trial"}
            </h1>
            <p className="text-white/50 text-sm font-body mt-1">
              {mode === "login"
                ? "Sign in to your Vee Digital dashboard"
                : "2 days free — no credit card required"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-display font-semibold text-white/60 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-display font-semibold text-white/60 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-white/15 text-white placeholder-white/30 text-sm font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-white/60 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-white/15 text-white placeholder-white/30 text-sm font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-body">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-body flex items-center gap-2">
                <Check size={15} /> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:bg-brand-light disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  {mode === "login" ? "Sign In" : "Create Free Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-xs text-white/30 mt-4 font-body">
              Forgot password?{" "}
              <button className="text-primary hover:underline">Reset here</button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-white/20 mt-6 font-body">
          Built by{" "}
          <a href="https://veedigitalsolutions.online" className="text-primary/70 hover:text-primary transition-colors">
            veedigitalsolutions.online
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
