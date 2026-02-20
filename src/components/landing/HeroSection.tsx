import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import heroVideo from "@/assets/hero-video.mp4";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <section className="relative h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay muted loop playsInline
          className="w-full h-full object-cover"
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
      </div>

      <div className="relative z-10 mt-auto pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl space-y-5">
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
      </div>
    </section>
  );
};

export default HeroSection;
