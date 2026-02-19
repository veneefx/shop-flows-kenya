import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Smartphone, BarChart3, ShoppingBag } from "lucide-react";
import heroVideo from "@/assets/hero-video.mp4";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <section className="relative h-screen flex flex-col overflow-hidden">
      {/* Full-screen background video — crystal clear, no opacity reduction */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Minimal dark gradient only at the very bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
      </div>

      {/* Content anchored to bottom */}
      <div className="relative z-10 mt-auto pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-10 items-end">
          {/* Left: Text */}
          <div className="space-y-5">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/60 bg-black/30 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-semibold text-sm font-display">
                Kenya's #1 POS + E-Commerce Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.05] drop-shadow-lg"
            >
              Sell More.{" "}
              <span className="text-primary">Earn More.</span>
              <br />
              <span className="text-white/90">Worry Less.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-base sm:text-lg text-white/80 font-body leading-relaxed max-w-lg drop-shadow"
            >
              Bringing products directly to your customers. Accept M-Pesa instantly,
              manage your store online, and grow — all from one dashboard.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <Link
                to="/auth?mode=signup"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-base shadow-brand hover:bg-brand-light hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Free — 2 Days
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30 text-white font-display font-semibold text-base hover:bg-white/20 transition-all duration-300"
              >
                <ShoppingBag size={16} className="text-primary" />
                See How It Works
              </button>
            </motion.div>
          </div>

          {/* Right: Floating metric cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="hidden lg:flex flex-col gap-3 items-end"
          >
            <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 w-56">
              <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
                <Smartphone size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-body">M-Pesa Received</p>
                <p className="text-primary font-bold font-display text-lg">KSh 4,500</p>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 w-56">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <BarChart3 size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-body">Today's Revenue</p>
                <p className="text-white font-bold font-display text-base">KSh 23,840</p>
              </div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 w-full mt-1">
              {[
                { v: "2,400+", l: "Merchants" },
                { v: "99.9%", l: "Uptime" },
                { v: "2-Day", l: "Free Trial" },
              ].map((s) => (
                <div key={s.l} className="bg-black/40 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
                  <p className="font-display font-black text-base text-primary">{s.v}</p>
                  <p className="text-white/50 text-xs font-body">{s.l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
