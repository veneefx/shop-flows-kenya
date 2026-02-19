import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Smartphone } from "lucide-react";

const CtaBanner = () => {
  return (
    <section className="py-24 bg-foreground relative overflow-hidden">
      {/* Green glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30">
            <Smartphone size={14} className="text-primary" />
            <span className="text-primary text-sm font-display font-semibold">M-Pesa Ready. Store Ready. Go Live Today.</span>
          </div>

          <h2 className="font-display font-black text-4xl lg:text-6xl text-white leading-tight">
            Your Business Deserves
            <br />
            <span className="text-primary">Elite Tools.</span>
          </h2>

          <p className="text-white/60 text-lg font-body">
            Join 2,400+ Kenyan merchants already using Vee Digital to run smarter, faster, more profitable businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth?mode=signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-base shadow-brand hover:bg-brand-light hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Start Free — 2 Days
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="text-white/30 text-xs font-body">No credit card • No setup fees • Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaBanner;
