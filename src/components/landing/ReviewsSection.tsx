import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useRef } from "react";
import { useInView } from "framer-motion";
import testimonialImg from "@/assets/testimonial-person.jpg";
import featureMerchant from "@/assets/feature-merchant.jpg";
import featurePos from "@/assets/feature-pos.jpg";

const testimonials = [
  {
    name: "Wanjiku Kamau",
    role: "Fashion Boutique Owner, Nairobi",
    content: "I was using WhatsApp to take orders and manually confirm M-Pesa. Vee Digital changed everything. My customers now shop online, pay instantly, and I get notified immediately. Sales are up 3x in 2 months.",
    stars: 5,
    img: featureMerchant,
  },
  {
    name: "Brian Odhiambo",
    role: "Electronics Shop, Kisumu",
    content: "The POS mode saved me when my internet was down during a busy Saturday. I could still take orders and M-Pesa payments synced when I was back online. Incredible product.",
    stars: 5,
    img: testimonialImg,
  },
  {
    name: "Grace Njeri",
    role: "Supermarket Owner, Eldoret",
    content: "Managing 3 shops from one dashboard is a game changer. The analytics tell me exactly which products are selling and when to restock. My accountant loves the CSV exports too.",
    stars: 5,
    img: featurePos,
  },
];

const ReviewsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="reviews" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16" ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-display font-semibold mb-4">
              Real Merchants. Real Results.
            </span>
            <h2 className="font-display font-black text-4xl lg:text-5xl text-foreground mb-4">
              Trusted by{" "}
              <span className="text-primary">2,400+ Merchants</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-amber-400" fill="currentColor" />
              ))}
              <span className="ml-2 text-muted-foreground font-body">4.9 average rating</span>
            </div>
          </motion.div>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="bg-card rounded-3xl p-7 border border-border shadow-card-custom hover:border-primary/30 hover:shadow-brand transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} size={14} className="text-amber-400" fill="currentColor" />
                ))}
              </div>
              <p className="text-foreground/80 font-body text-sm leading-relaxed mb-6">
                "{t.content}"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-primary/20"
                />
                <div>
                  <p className="font-display font-semibold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 rounded-3xl bg-foreground p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {[
            { v: "KSh 890M+", l: "Processed" },
            { v: "98%", l: "Payment Success Rate" },
            { v: "< 5s", l: "STK Push Speed" },
            { v: "24/7", l: "System Uptime" },
          ].map((s, i) => (
            <div key={i}>
              <p className="font-display font-black text-3xl text-primary">{s.v}</p>
              <p className="text-white/60 text-sm font-body mt-1">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsSection;
