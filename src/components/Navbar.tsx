import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, MoreVertical, X, ChevronRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/logo.png";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLanding = location.pathname === "/";

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Reviews", href: "#reviews" },
    { label: "FAQ", href: "#faq" },
  ];

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (!isLanding) {
      navigate("/");
      setTimeout(() => {
        document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isLanding ? "glass-dark shadow-xl" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo — transparent bg, no green box */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src={logoImg}
                alt="Dukalangu"
                className="w-12 h-12 object-contain drop-shadow-lg"
              />
              <div className="hidden sm:block">
                <span className="font-display font-bold text-lg text-white leading-none">Dukalangu</span>
              </div>
            </Link>

            {/* Right: theme + three-dot */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-200 text-white"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {theme === "dark" ? (
                    <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Sun size={16} />
                    </motion.span>
                  ) : (
                    <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Moon size={16} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Three-dot menu button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition text-white"
                aria-label="Menu"
              >
                {menuOpen ? <X size={18} /> : <MoreVertical size={18} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Slide-in menu from top-right */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, x: 320, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 320, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-4 right-4 z-50 w-72 rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "hsl(220 20% 6% / 0.97)", border: "1px solid hsl(220 15% 20% / 0.6)", backdropFilter: "blur(24px)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <img src={logoImg} alt="Dukalangu" className="w-7 h-7 object-contain" />
                  <span className="font-display font-bold text-sm text-white">Dukalangu</span>
                </div>
                <button onClick={() => setMenuOpen(false)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              {/* Nav links */}
              <div className="px-3 py-3">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => scrollTo(link.href)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-display font-medium text-white/70 hover:text-white hover:bg-white/8 rounded-xl transition-all group"
                  >
                    {link.label}
                    <ChevronRight size={14} className="text-white/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-white/10">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:bg-brand-light transition-all"
                  >
                    Go to Dashboard
                    <ChevronRight size={15} />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-display font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth?mode=signup"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-brand hover:bg-brand-light transition-all"
                    >
                      Start Free Trial
                      <ChevronRight size={15} />
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
