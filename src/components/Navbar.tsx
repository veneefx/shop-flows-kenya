import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, ChevronDown } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/logo.png";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
    setMobileOpen(false);
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
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isLanding
          ? "glass-dark shadow-xl"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-brand">
              <img src={logoImg} alt="Vee Digital Solutions" className="w-6 h-6 object-contain" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-lg text-white leading-none">Vee Digital</span>
              <p className="text-xs text-white/50 leading-none font-body">Solutions</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
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

            {user ? (
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm shadow-brand hover:bg-brand-light transition-all duration-200"
              >
                Dashboard
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/auth"
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-brand hover:bg-brand-light hover:shadow-lg transition-all duration-200"
                >
                  Start Free Trial
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition text-white"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden glass-dark border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="text-left px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  {link.label}
                </button>
              ))}
              <div className="border-t border-white/10 pt-3 mt-1 flex flex-col gap-2">
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-sm text-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  Sign In
                </Link>
                <Link to="/auth?mode=signup" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-sm text-center font-semibold rounded-xl bg-primary text-primary-foreground shadow-brand">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
