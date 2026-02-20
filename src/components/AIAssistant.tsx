import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are Vee, a warm, helpful AI assistant for Vee Digital Solutions — Kenya's premier POS & e-commerce platform. You speak naturally, like a real human business consultant would. You help merchants:
- Navigate the dashboard (products, orders, analytics, payments, settings)
- Set up their Lipana M-Pesa integration
- Understand features and plans (Starter: KSh 3,499, Business: KSh 9,999, Enterprise: KSh 30,000)
- Troubleshoot issues
- Use their public store

Keep responses concise, warm, and practical. Use Kenyan context naturally. If you don't know something specific, say so honestly and point to support.`;

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! 👋 I'm Vee, your AI business assistant. I can walk you through the platform, help set up M-Pesa payments, explain features — anything you need. What would you like help with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vee-assistant`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok) throw new Error("Failed");

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let assistantSoFar = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              assistantSoFar += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* partial json */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again!" }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-2xl overflow-hidden hover:scale-110 transition-transform duration-200"
        style={{ boxShadow: "0 8px 32px hsl(142 71% 45% / 0.4)" }}
      >
        <div className="w-full h-full bg-primary flex items-center justify-center">
          {open ? (
            <X size={22} className="text-white" />
          ) : (
            /* Businesswoman emoji as fallback icon */
            <span className="text-2xl select-none">👩‍💼</span>
          )}
        </div>
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse" />
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: "hsl(220 20% 6% / 0.97)",
              border: "1px solid hsl(220 15% 20% / 0.6)",
              backdropFilter: "blur(24px)",
              maxHeight: "70vh",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-lg">👩‍💼</div>
              <div>
                <p className="font-display font-bold text-sm text-white">Vee — AI Assistant</p>
                <p className="text-xs text-white/40 font-body flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Always here to help
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "calc(70vh - 140px)" }}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5">👩‍💼</div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white/8 text-white/90 rounded-bl-sm border border-white/10"
                  }`}>
                    {msg.content || (loading && msg.role === "assistant" ? (
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : msg.content)}
                  </div>
                </motion.div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {["How do I add products?", "Set up M-Pesa", "View my orders", "Upgrade my plan"].map(s => (
                  <button key={s} onClick={() => { setInput(s); }}
                    className="px-2.5 py-1 rounded-full bg-white/8 text-white/60 text-xs font-body hover:bg-primary/20 hover:text-white/90 border border-white/10 hover:border-primary/30 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2 border border-white/10 focus-within:border-primary/40 transition-colors">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent text-white text-sm font-body placeholder-white/30 focus:outline-none"
                />
                <button onClick={send} disabled={loading || !input.trim()}
                  className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 hover:bg-brand-light transition-colors flex-shrink-0">
                  {loading ? <Loader2 size={13} className="animate-spin text-white" /> : <Send size={13} className="text-white" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
