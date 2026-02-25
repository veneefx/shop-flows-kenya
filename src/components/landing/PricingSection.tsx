import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Lite",
    price: "1,899",
    period: "/ month",
    tagline: "For small entrepreneurs",
    highlight: false,
    features: [
      "Up to 20 products",
      "Public store link",
      "M-Pesa STK Push",
      "Basic order management",
      "Email support",
      "2-day free trial",
    ],
    cta: "Start Lite",
    color: "border-border",
  },
  {
    name: "Starter",
    price: "3,499",
    period: "/ month",
    tagline: "Perfect for new businesses",
    highlight: false,
    features: [
      "Up to 50 products",
      "Public store link",
      "M-Pesa STK Push (Lipana)",
      "Basic analytics dashboard",
      "Order management",
      "Customer management",
      "Email support",
      "2-day free trial",
    ],
    cta: "Start with Starter",
    color: "border-border",
  },
  {
    name: "Business",
    price: "9,999",
    period: "/ month",
    tagline: "For growing businesses",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Unlimited products",
      "Custom domain support",
      "Advanced analytics + charts",
      "WhatsApp order alerts",
      "CSV export & reports",
      "Coupon & discount system",
      "Bulk product import (CSV)",
      "Priority support",
      "2-day free trial",
    ],
    cta: "Go Business",
    color: "border-primary",
  },
  {
    name: "Enterprise",
    price: "30,000",
    period: "/ month",
    tagline: "For large-scale operations",
    highlight: false,
    features: [
      "Everything in Business",
      "Multi-user access",
      "Multi-shop management",
      "API access",
      "Custom features",
      "Audit logs",
      "Dedicated support manager",
      "Custom SLA",
      "White-label options",
    ],
    cta: "Contact Sales",
    color: "border-border",
  },
];

const PricingSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16" ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-display font-semibold mb-4">
              Simple Pricing
            </span>
            <h2 className="font-display font-black text-4xl lg:text-5xl text-foreground mb-4">
              Plans That{" "}
              <span className="text-primary">Grow With You</span>
            </h2>
            <p className="text-muted-foreground font-body text-lg">
              Start free for 2 days. No credit card required. Cancel anytime.
            </p>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative rounded-3xl border-2 ${plan.color} bg-card p-7 flex flex-col ${
                plan.highlight ? "shadow-brand scale-[1.02] lg:scale-105" : "shadow-card-custom"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-display font-bold shadow-brand">
                    <Zap size={12} fill="currentColor" /> {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">{plan.tagline}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-xs text-muted-foreground font-body">KSh</span>
                  <span className="font-display font-black text-3xl text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground font-body">{plan.period}</span>
                </div>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      plan.highlight ? "bg-primary/20" : "bg-accent"
                    }`}>
                      <Check size={12} className="text-primary" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-foreground font-body">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.name === "Enterprise" ? "#contact" : "/auth?mode=signup"}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-semibold text-sm transition-all duration-200 ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground shadow-brand hover:bg-brand-light hover:shadow-lg"
                    : "bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/40"
                }`}
              >
                {plan.cta} <ArrowRight size={15} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground font-body mt-10"
        >
          All plans include a 2-day free trial. No card required. Subscription payments approved by admin.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
