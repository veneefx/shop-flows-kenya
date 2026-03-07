import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MessageCircle, ChevronDown, ChevronUp, Check } from "lucide-react";
import logoImg from "@/assets/logo.png";

const legalText = `By using Duka Langu, you agree to our Terms & Conditions, Privacy Policy, and Cookie Policy, all governed by the laws of the Republic of Kenya. We comply with the Kenya Data Protection Act (2019) and the Consumer Protection Act (2012). Subscription fees are non-refundable except as required by law. M-Pesa transactions are processed via Lipana/Safaricom and governed by their respective policies. We maintain a 99.9% uptime SLA. For disputes, contact us first; unresolved matters go to Kenyan courts in Nairobi. Your data is encrypted, never sold, and deletable upon request. © ${new Date().getFullYear()} Duka Langu — Built & Maintained by Vlogic Digital Solution • www.vdigitalsolution.online`;

const Footer = () => {
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  return (
    <footer className="bg-foreground text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logoImg} alt="Dukalangu" className="w-12 h-12 object-contain drop-shadow-lg" />
              <span className="font-display font-bold text-xl text-white block leading-none">Dukalangu</span>
            </Link>
            <p className="text-white/50 text-sm font-body leading-relaxed max-w-xs">
              Your global SaaS POS + E-Commerce platform. Accept payments instantly, manage your store, and grow your business — anywhere.
            </p>
            <div className="space-y-2.5 pt-2">
              <a href="mailto:veedigitalsolutions@gmail.com" className="flex items-center gap-2.5 text-sm text-white/60 hover:text-primary transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors"><Mail size={14} /></div>
                veedigitalsolutions@gmail.com
              </a>
              <a href="tel:+254111944791" className="flex items-center gap-2.5 text-sm text-white/60 hover:text-primary transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors"><Phone size={14} /></div>
                +254 111 944 791
              </a>
              <a href="https://wa.me/254111944791" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-white/60 hover:text-primary transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors"><MessageCircle size={14} /></div>
                WhatsApp: +254 111 944 791
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5 text-sm text-white/50 font-body">
              {["Features", "Pricing", "Reviews", "FAQ"].map(l => (
                <li key={l}><a href={`#${l.toLowerCase()}`} className="hover:text-primary transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5 text-sm text-white/50 font-body">
              {["Setup Guide", "WhatsApp Support", "API Reference", "Blog"].map(l => (
                <li key={l}><a href="#" className="hover:text-primary transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm text-white/50 font-body">
              <li><a href="https://veedigitalsolutions.online" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="mailto:veedigitalsolutions@gmail.com" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="https://wa.me/254111944791" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">WhatsApp Support</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-10 border-t border-white/10">
          <button onClick={() => setLegalOpen(!legalOpen)} className="flex items-center gap-3 text-white/50 hover:text-white/80 transition-colors text-sm font-display font-medium group">
            <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center group-hover:border-primary/50 transition-colors">
              {legalOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
            Legal Information & Policies
            <span className="text-white/30 text-xs font-body font-normal">(click to expand)</span>
          </button>
          <AnimatePresence>
            {legalOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                <div className="mt-4 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs font-body leading-relaxed">{legalText}</p>
                  <label className="mt-4 flex items-center gap-3 cursor-pointer group/check">
                    <button onClick={() => setLegalAccepted(!legalAccepted)} className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${legalAccepted ? "bg-primary border-primary" : "border-white/30 group-hover/check:border-primary/50"}`}>
                      {legalAccepted && <Check size={12} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className="text-white/50 text-xs font-body group-hover/check:text-white/70 transition-colors">I have read and agree to the legal policies above</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs font-body text-center">© {new Date().getFullYear()} Duka Langu. All rights reserved.</p>
          <p className="text-white/40 text-xs font-body text-center">
            Built, Developed & Maintained by{" "}
            <a href="https://vdigitalsolution.online" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-brand-light transition-colors font-semibold">Vlogic Digital Solution</a>
            {" • "}<a href="https://vdigitalsolution.online" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-primary transition-colors">www.vdigitalsolution.online</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
