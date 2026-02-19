import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "How does the 2-day free trial work?",
    a: "When you sign up, you immediately get full access to all features for 2 days — no credit card required. After the trial, you choose a plan and your admin approves the subscription to continue.",
  },
  {
    q: "How does M-Pesa payment work for my customers?",
    a: "When a customer checks out, they enter their M-Pesa phone number. An STK Push is sent directly to their phone. They enter their M-Pesa PIN and the payment is confirmed in under 5 seconds. Funds go to your Lipana wallet.",
  },
  {
    q: "Can I use my own Lipana (M-Pesa API) keys?",
    a: "Yes. Go to Dashboard → Settings → Payments. Enter your Lipana Secret Key, Publishable Key, and Webhook Secret. These are encrypted and stored securely. You control your own payment flows.",
  },
  {
    q: "Can I use this as a walk-in POS (offline)?",
    a: "Absolutely. The POS Mode works for walk-in customers. You can enter manual orders, accept cash or M-Pesa, and sync everything when back online. No internet required for the core POS functions.",
  },
  {
    q: "What happens if I have multiple shops or branches?",
    a: "Each shop has its own dashboard, storefront URL, product catalog, and payment settings. From the Enterprise plan, you can manage multiple shops from one account.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use JWT authentication, bcrypt password hashing, HMAC-SHA256 webhook verification, rate limiting, and row-level security at the database level. Your data is encrypted at rest and in transit.",
  },
  {
    q: "Can customers find my store online?",
    a: "Yes. Every shop gets a public URL: veeapp.com/store/your-shop-name. Share it on Instagram, WhatsApp, Facebook, or anywhere. Customers can browse products and pay via M-Pesa without an account.",
  },
  {
    q: "What is Lipana and do I need an account?",
    a: "Lipana is a Kenya-based M-Pesa API provider that gives you access to Safaricom's Daraja API without the complex setup. You'll need to create a free Lipana account at lipana.dev and get your API keys.",
  },
  {
    q: "How do I upgrade my plan?",
    a: "Go to Dashboard → Upgrade Plan. Select your desired plan and submit your payment proof. Our admin will review and approve your subscription within 24 hours.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export orders, customers, and transactions as CSV files. Perfect for accounting, tax compliance, or migrating to other systems. You can also print receipts for walk-in customers.",
  },
];

const FaqItem = ({ faq, index }: { faq: typeof faqs[0]; index: number }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="border border-border rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 lg:p-6 text-left bg-card hover:bg-accent/50 transition-colors duration-200"
      >
        <span className="font-display font-semibold text-foreground text-sm lg:text-base pr-4">{faq.q}</span>
        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 ${open ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-5 lg:px-6 pb-5 pt-0 bg-card">
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FaqSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="faq" className="py-24 lg:py-32 bg-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14" ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-display font-semibold mb-4">
              Frequently Asked Questions
            </span>
            <h2 className="font-display font-black text-4xl lg:text-5xl text-foreground">
              Got <span className="text-primary">Questions?</span>
            </h2>
          </motion.div>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
