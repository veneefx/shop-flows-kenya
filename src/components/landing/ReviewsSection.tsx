import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Send, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Calendar } from "lucide-react";

interface Review {
  id: string;
  name: string;
  business: string | null;
  content: string;
  rating: number;
  created_at: string;
  is_approved?: boolean;
}

const ReviewsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", business: "", content: "", rating: 5 });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReviews();
    
    // Subscribe to real-time updates for approved reviews
    const channel = supabase
      .channel("reviews-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reviews", filter: "is_approved=eq.true" },
        (payload) => {
          const updatedReview = payload.new as Review;
          setReviews(prev => {
            const exists = prev.some(r => r.id === updatedReview.id);
            if (exists) {
              return prev.map(r => r.id === updatedReview.id ? updatedReview : r);
            } else {
              return [updatedReview, ...prev].slice(0, 6);
            }
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) {
        console.error("Error fetching reviews:", error);
      }
      if (data) setReviews(data);
    } catch (err) {
      console.error("Unexpected error fetching reviews:", err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) {
      setError("Name and review are required.");
      return;
    }
    if (form.content.trim().length < 20) {
      setError("Review must be at least 20 characters.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const { error: err, data } = await supabase.from("reviews").insert({
        name: form.name.trim(),
        business: form.business.trim() || null,
        content: form.content.trim(),
        rating: form.rating,
        is_approved: false,
      }).select();

      setSubmitting(false);
      if (err) {
        console.error("Review submission error:", err);
        setError("Failed to submit. Please try again.");
      } else if (data && data.length > 0) {
        setSubmitted(true);
        setForm({ name: "", business: "", content: "", rating: 5 });
        // Optionally refresh reviews after a delay to show it in the pending state
        setTimeout(() => {
          fetchReviews();
        }, 1000);
      } else {
        setError("Failed to submit. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setSubmitting(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const starRating = (rating: number, interactive = false, onRate?: (r: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={interactive && onRate ? () => onRate(s) : undefined}
          className={`text-lg leading-none transition-colors ${
            s <= rating ? "text-amber-400" : "text-foreground/20"
          } ${interactive ? "hover:text-amber-400 cursor-pointer" : "cursor-default"}`}
          tabIndex={interactive ? 0 : -1}
        >
          ★
        </button>
      ))}
    </div>
  );

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
            <h2 className="font-display font-black text-4xl lg:text-5xl text-foreground mb-3">
              Trusted by{" "}
              <span className="text-primary">Businesses Worldwide</span>
            </h2>
            <p className="text-muted-foreground font-body text-base">
              Hear what our merchants say about Duka Langu.
            </p>
          </motion.div>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-3xl p-7 border border-border h-48 animate-pulse" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-card rounded-3xl p-7 border border-border hover:border-primary/30 hover:shadow-[0_8px_32px_-8px_hsl(142_71%_45%/0.2)] transition-all duration-300 flex flex-col"
              >
                {/* Stars */}
                <div className="flex items-center justify-between mb-3">
                  {starRating(r.rating)}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                    <Calendar size={11} />
                    {formatDate(r.created_at)}
                  </span>
                </div>

                {/* Comment */}
                <p className="text-foreground/80 font-body text-sm leading-relaxed mb-5 flex-1">
                  &ldquo;{r.content}&rdquo;
                </p>

                {/* Reviewer info */}
                <div className="pt-4 border-t border-border">
                  <p className="font-display font-semibold text-sm text-foreground">{r.name}</p>
                  {r.business && (
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{r.business}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground font-body">
            <MessageSquare size={40} className="mx-auto mb-3 text-primary/40" />
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        )}

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 rounded-3xl bg-foreground p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
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

        {/* Leave a Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 max-w-xl mx-auto"
        >
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all font-display font-semibold text-foreground"
          >
            <span className="flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Leave a Review
            </span>
            {showForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 bg-card border border-border rounded-2xl p-6"
            >
              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle size={40} className="text-primary mx-auto mb-3" />
                  <p className="font-display font-semibold text-foreground text-lg">Thank you!</p>
                  <p className="text-muted-foreground font-body text-sm mt-1">
                    Your review has been submitted and is pending approval.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setShowForm(false); }}
                    className="mt-4 text-sm text-primary font-display font-semibold hover:underline"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-display font-semibold text-foreground mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Wanjiku"
                        maxLength={80}
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-display font-semibold text-foreground mb-1.5">
                        Business (optional)
                      </label>
                      <input
                        type="text"
                        value={form.business}
                        onChange={(e) => setForm({ ...form, business: e.target.value })}
                        placeholder="Fashion Boutique, Nairobi"
                        maxLength={100}
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-display font-semibold text-foreground mb-1.5">
                      Rating *
                    </label>
                    {starRating(form.rating, true, (r) => setForm({ ...form, rating: r }))}
                  </div>

                  <div>
                    <label className="block text-xs font-display font-semibold text-foreground mb-1.5">
                      Your Review *
                    </label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Share your experience with Duka Langu..."
                      rows={4}
                      maxLength={600}
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{form.content.length}/600</p>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive font-body">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-brand hover:bg-brand-light transition-all disabled:opacity-60"
                  >
                    {submitting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                    ) : (
                      <Send size={15} />
                    )}
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                  <p className="text-xs text-center text-muted-foreground font-body">
                    Reviews are moderated and may take 24–48 hours to appear.
                  </p>
                </form>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsSection;
