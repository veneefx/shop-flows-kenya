import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  ShoppingCart, Smartphone, BarChart3, Package,
  Users, Globe, Zap, Shield, Bell, Download,
  CreditCard, Store
} from "lucide-react";
import featureMerchant from "@/assets/feature-merchant.jpg";
import featurePos from "@/assets/feature-pos.jpg";
import featureAnalytics from "@/assets/feature-analytics.jpg";
import featuresVideo from "@/assets/features-video.mp4";
import showcaseVideo from "@/assets/showcase-video.mp4";

const features = [
  { icon: ShoppingCart, title: "Smart E-Commerce Store", desc: "Beautiful public storefront with product listings, cart, categories, and seamless checkout flow." },
  { icon: Smartphone, title: "M-Pesa STK Push", desc: "Instant M-Pesa payment requests via Lipana. Customer gets STK push on their phone in seconds." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track revenue, top products, customer behaviour, and daily performance from your dashboard." },
  { icon: Package, title: "Inventory Management", desc: "Low stock alerts, bulk CSV import, stock tracking, and category management built-in." },
  { icon: Users, title: "Customer Database", desc: "Know your customers — purchase history, contact info, total spend, and loyalty insights." },
  { icon: Globe, title: "Custom Store URL", desc: "Get your own public store link: vee.app/store/your-shop-name. Share on social media." },
  { icon: Zap, title: "POS Mode (Offline)", desc: "Walk-in customers? Use the built-in POS for manual orders, even without internet." },
  { icon: Shield, title: "Enterprise Security", desc: "JWT auth, bcrypt passwords, HMAC webhook verification, rate limiting, and GDPR compliance." },
  { icon: Bell, title: "WhatsApp & Email Alerts", desc: "Instant order notifications to your phone via WhatsApp and email — never miss a sale." },
  { icon: Download, title: "CSV Export & Reports", desc: "Export orders, customers, and financial reports. Print receipts for walk-in customers." },
  { icon: CreditCard, title: "Coupon & Discount System", desc: "Create promo codes, percentage discounts, and time-limited offers to boost conversions." },
  { icon: Store, title: "Multi-Shop Ready", desc: "Manage multiple shops from one account. Perfect for merchants with multiple locations." },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-brand transition-all duration-300 hover:-translate-y-1"
    >
      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors duration-300">
        <Icon size={22} className="text-primary" />
      </div>
      <h3 className="font-display font-semibold text-base text-foreground mb-2">{feature.title}</h3>
      <p className="text-sm text-muted-foreground font-body leading-relaxed">{feature.desc}</p>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 lg:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-display font-semibold mb-4">
              Everything You Need
            </span>
            <h2 className="font-display font-black text-4xl lg:text-5xl text-foreground mb-4">
              Built for Kenyan{" "}
              <span className="text-primary">Business Owners</span>
            </h2>
            <p className="text-lg text-muted-foreground font-body">
              From your first sale to your thousandth order — Vee Digital handles the tech so you can focus on growing.
            </p>
          </motion.div>
        </div>

        {/* Feature Showcase: Merchant Image + Video Split */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {/* Merchant Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-3xl overflow-hidden shadow-xl-custom"
          >
            <img
              src={featureMerchant}
              alt="Kenyan merchant using Vee Digital"
              className="w-full h-72 lg:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="glass rounded-xl p-4">
                <p className="text-white font-display font-bold text-lg">Your Store, Online & Offline</p>
                <p className="text-white/70 text-sm font-body mt-1">Serve walk-in customers at the counter and online shoppers — from one unified platform.</p>
              </div>
            </div>
          </motion.div>

          {/* POS Video */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative rounded-3xl overflow-hidden shadow-xl-custom"
          >
            <video
              autoPlay muted loop playsInline
              className="w-full h-72 lg:h-96 object-cover"
              preload="auto"
            >
              <source src={featuresVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="glass rounded-xl p-4">
                <p className="text-white font-display font-bold text-lg">M-Pesa Payments, Instant</p>
                <p className="text-white/70 text-sm font-body mt-1">Customer pays via STK Push — funds reflect in seconds. No more waiting.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Analytics showcase + video */}
        <div className="grid lg:grid-cols-5 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 relative rounded-3xl overflow-hidden shadow-xl-custom"
          >
            <video
              autoPlay muted loop playsInline
              className="w-full h-64 lg:h-80 object-cover"
              preload="auto"
            >
              <source src={showcaseVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/30 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="p-8 max-w-xs">
                <p className="text-white font-display font-black text-2xl mb-2">Happy Customers,<br />Happy Business</p>
                <p className="text-white/70 text-sm font-body">Join thousands of merchants growing their revenue with Vee Digital Solutions.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-2 relative rounded-3xl overflow-hidden shadow-xl-custom"
          >
            <img
              src={featureAnalytics}
              alt="Analytics dashboard"
              className="w-full h-64 lg:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="glass rounded-xl p-4">
                <p className="text-white font-display font-bold">Revenue Analytics</p>
                <p className="text-white/70 text-xs font-body mt-1">Real-time charts, best sellers, and monthly comparisons.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
