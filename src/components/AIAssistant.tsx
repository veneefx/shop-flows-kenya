import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import logoImg from "@/assets/logo.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! 👋 I'm Vee, your AI business assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const fullTextRef = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, displayedText]);

  // Letter-by-letter typing effect
  useEffect(() => {
    if (streamingIndex === null) return;
    const fullText = fullTextRef.current;
    if (displayedText.length >= fullText.length) return;

    const timer = setTimeout(() => {
      const nextLen = displayedText.length + 1;
      const newDisplayed = fullText.slice(0, nextLen);
      setDisplayedText(newDisplayed);
      // Update the message in place
      setMessages(prev =>
        prev.map((m, i) => i === streamingIndex ? { ...m, content: newDisplayed } : m)
      );
    }, 12 + Math.random() * 18); // Variable speed for human feel

    return () => clearTimeout(timer);
  }, [displayedText, streamingIndex]);

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
      let assistantFull = "";
      let textBuffer = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      const msgIndex = messages.length + 1; // +1 for user msg just added
      setStreamingIndex(msgIndex);
      fullTextRef.current = "";
      setDisplayedText("");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              assistantFull += delta;
              fullTextRef.current = assistantFull;
            }
          } catch { /* partial chunk */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again!" }]);
      setStreamingIndex(null);
    }

    // Wait for typing to finish
    const waitForTyping = () => {
      return new Promise<void>((resolve) => {
        const check = () => {
          if (fullTextRef.current.length <= 0 || displayedText.length >= fullTextRef.current.length) {
            resolve();
          } else {
            setTimeout(check, 50);
          }
        };
        setTimeout(check, 200);
      });
    };

    setLoading(false);
    // Streaming index will clear once typing catches up
    const clearCheck = setInterval(() => {
      if (!fullTextRef.current || displayedText.length >= fullTextRef.current.length - 5) {
        setStreamingIndex(null);
        clearInterval(clearCheck);
      }
    }, 100);
    setTimeout(() => { setStreamingIndex(null); clearInterval(clearCheck); }, 30000);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 w-16 h-16 rounded-full shadow-2xl overflow-hidden hover:scale-110 transition-transform duration-200 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20"
        style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }}
      >
        {open ? <X size={24} className="text-white" /> : <img src={logoImg} alt="Vee" className="w-10 h-10 object-contain" />}
        {!open && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse" />}
      </motion.button>

      {/* Chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ background: "hsl(220 20% 6% / 0.97)", border: "1px solid hsl(220 15% 20% / 0.6)", backdropFilter: "blur(24px)", maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <img src={logoImg} alt="Vee" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-white">Vee — AI Assistant</p>
                <p className="text-xs text-white/40 font-body flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Always here to help
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/40 hover:text-white"><X size={16} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "calc(70vh - 140px)" }}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <img src={logoImg} alt="" className="w-4 h-4 object-contain" />
                    </div>
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
                    {/* Blinking cursor while streaming */}
                    {streamingIndex === i && msg.role === "assistant" && msg.content && (
                      <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {["How do I add products?", "Set up M-Pesa", "View my orders", "Upgrade my plan"].map(s => (
                  <button key={s} onClick={() => setInput(s)}
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
                  className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-colors flex-shrink-0">
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
