import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/logo.png";
import authVideo from "@/assets/auth-video.mp4";
import authVideo2 from "@/assets/auth-video-2.mp4";

// Google icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// Apple icon
const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <path d="M13.013 9.368c-.013-1.564.854-2.756 2.6-3.632-.978-1.394-2.46-2.164-4.416-2.313-1.87-.144-3.905 1.096-4.655 1.096-.79 0-2.613-1.042-4.06-1.042C.337 3.52-2.05 5.64-2.05 9.97c0 1.363.25 2.77.751 4.218.668 1.893 3.08 6.53 5.59 6.453 1.363-.033 2.327-.958 4.085-.958 1.704 0 2.6.958 4.085.958 2.527-.039 4.714-4.27 5.362-6.17-3.413-1.602-4.81-4.74-4.81-5.103z"/>
    <path d="M11.14 2.285C12.432.765 12.313-.637 12.274-.96c-1.25.07-2.7.836-3.493 1.79-.873 1.026-.985 2.374-.946 2.695 1.356.105 2.6-.64 3.305-1.24z"/>
  </svg>
);

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  // Open panel automatically
  useEffect(() => {
    const timer = setTimeout(() => setPanelOpen(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
        setSuccess("Account created! Check your email to verify.");
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

  const handleSocial = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (error) setError((error as Error).message || "Social login failed.");
    } catch (err: any) {
      setError(err.message || "Social login failed.");
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Full-screen background video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: panelOpen ? "blur(6px) brightness(0.5)" : "brightness(0.75)", transition: "filter 0.8s ease" }}
      >
        <source src={mode === "signup" ? authVideo2 : authVideo} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20" />

      {/* Hero text — left side, visible behind panel */}
      <div className="relative z-10 h-screen flex flex-col justify-center px-10 lg:px-20 max-w-lg pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: panelOpen ? 0.4 : 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <Link to="/" className="inline-flex items-center gap-2.5 pointer-events-auto">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-brand">
              <img src={logoImg} alt="Duka Langu" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white block leading-none">Duka Langu</span>
              <span className="text-white/40 text-xs font-body">POS & E-Commerce</span>
            </div>
          </Link>
          <h1 className="font-display font-black text-4xl lg:text-5xl text-white leading-tight">
            Kenya's #1<br />
            <span className="text-primary">POS + Store</span><br />
            Platform
          </h1>
          <p className="text-white/70 font-body text-base leading-relaxed">
            Bringing products directly to your customers. Accept M-Pesa instantly.
          </p>
        </motion.div>
      </div>

      {/* Slide-in Auth Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 overflow-y-auto"
          >
            {/* Panel glass background */}
            <div className="min-h-full flex flex-col bg-black/80 backdrop-blur-2xl border-l border-white/10 px-8 py-10">
              {/* Close button — goes back to landing */}
              <div className="flex items-center justify-between mb-8">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <img src={logoImg} alt="Duka Langu" className="w-5 h-5 object-contain" />
                  </div>
                  <span className="font-display font-semibold text-white text-sm">Duka Langu</span>
                </Link>
                <Link
                  to="/"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <X size={16} />
                </Link>
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-7">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-display font-semibold transition-all duration-200 ${
                      mode === m
                        ? "bg-primary text-primary-foreground shadow-brand"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {m === "login" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <h2 className="font-display font-black text-2xl text-white">
                  {mode === "login" ? "Welcome back 👋" : "Start your journey"}
                </h2>
                <p className="text-white/40 text-sm font-body mt-1">
                  {mode === "login"
                    ? "Sign in to your dashboard"
                    : "2 days free — no credit card required"}
                </p>
              </div>

              {/* Social Logins */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleSocial("google")}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-gray-800 font-display font-semibold text-sm hover:bg-gray-100 transition-all disabled:opacity-60"
                >
                  {socialLoading === "google" ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
                  Continue with Google
                </button>
                <button
                  onClick={() => handleSocial("apple")}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/10 border border-white/15 text-white font-display font-semibold text-sm hover:bg-white/15 transition-all disabled:opacity-60"
                >
                  {socialLoading === "apple" ? <Loader2 size={16} className="animate-spin" /> : <AppleIcon />}
                  Continue with Apple
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs font-body">or continue with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-display font-semibold text-white/50 mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl border border-white/15 text-white placeholder-white/25 text-sm font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-display font-semibold text-white/50 mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-white/15 text-white placeholder-white/25 text-sm font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold text-white/50 mb-1.5 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={8}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-white/15 text-white placeholder-white/25 text-sm font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
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
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:bg-brand-light disabled:opacity-60 transition-all duration-200"
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
                <p className="text-center text-xs text-white/25 mt-4 font-body">
                  Forgot password?{" "}
                  <button className="text-primary/70 hover:text-primary transition-colors">
                    Reset here
                  </button>
                </p>
              )}

              <p className="text-center text-xs text-white/15 mt-6 font-body">
                Built by{" "}
                <a href="https://vdigitalsolution.online" className="text-primary/50 hover:text-primary transition-colors">
                  Vlogic Digital Solution
                </a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button if panel closed (shouldn't happen but fallback) */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-brand hover:bg-brand-light transition-all"
        >
          {mode === "login" ? "Sign In" : "Get Started"}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
};

export default AuthPage;
