import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, ShoppingBag, BarChart3, Smartphone, Star } from "lucide-react";
import heroVideo from "@/assets/hero-video.mp4";
import shoppingBagsImg from "@/assets/shopping-bags.png";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const stats = [
    { value: "2,400+", label: "Active Merchants" },
    { value: "KSh 890M+", label: "Processed Monthly" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "2-Day", label: "Free Trial" },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-foreground">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-25"
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="video-overlay" />
        {/* Green gradient accent */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/40"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-medium text-sm font-display">
                Kenya's #1 POS + E-Commerce Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05]">
                Sell More.{" "}
                <span className="text-primary">Earn More.</span>
                <br />
                <span className="text-white/90">Worry Less.</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-lg sm:text-xl text-white/70 font-body leading-relaxed max-w-lg"
            >
              The all-in-one POS + E-Commerce platform built for Kenyan businesses.
              Accept M-Pesa instantly, manage your store online, and grow — all from one dashboard.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/auth?mode=signup"
                className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-base shadow-brand hover:bg-brand-light hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Free — 2 Days
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl glass border border-white/20 text-white font-display font-semibold text-base hover:bg-white/10 transition-all duration-300"
              >
                <Play size={16} className="text-primary" fill="currentColor" />
                See How It Works
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex items-center gap-4 pt-2"
            >
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br ${
                    ["from-green-400 to-emerald-600", "from-blue-400 to-indigo-600", "from-orange-400 to-red-500", "from-purple-400 to-pink-500"][i]
                  }`} />
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-amber-400" fill="currentColor" />
                ))}
                <span className="ml-1.5 text-sm text-white/70 font-body">4.9 from 200+ merchants</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Shopping bags image — blended with video */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="relative hidden lg:flex items-center justify-center"
          >
            {/* Glow ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-96 rounded-full bg-primary/15 blur-3xl animate-float" />
            </div>

            {/* Image */}
            <div className="relative z-10">
              <img
                src={shoppingBagsImg}
                alt="Shopping bags — representing your store"
                className="w-full max-w-md object-contain drop-shadow-2xl mix-blend-luminosity opacity-90 hover:opacity-100 hover:mix-blend-normal transition-all duration-500 hover:scale-105"
                style={{ filter: "drop-shadow(0 0 60px hsl(142 71% 45% / 0.3))" }}
              />
            </div>

            {/* Floating cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="absolute bottom-10 -left-4 glass rounded-2xl p-4 border border-primary/30 shadow-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Smartphone size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-white text-sm font-display font-semibold">M-Pesa Received</p>
                  <p className="text-primary font-bold font-display text-lg">KSh 4,500</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="absolute top-16 -right-4 glass rounded-2xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <BarChart3 size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-body">Today's Revenue</p>
                  <p className="text-white font-bold font-display text-base">KSh 23,840</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-4">
              <p className="font-display font-black text-3xl lg:text-4xl text-primary">{stat.value}</p>
              <p className="text-white/60 text-sm mt-1 font-body">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
