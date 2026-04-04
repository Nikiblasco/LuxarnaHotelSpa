import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  { label: "Room Inquiries",       prompt: "Tell me about your available rooms and pricing." },
  { label: "Restaurant Inquiries", prompt: "What are your restaurant hours and what do you serve?" },
  { label: "Spa Inquiries",        prompt: "What spa services do you offer and what are the prices?" },
];

// Local knowledge base — answers quick-action questions without calling OpenAI
const LOCAL_KB: Record<string, string> = {
  "Tell me about your available rooms and pricing.":
`We have 4 room types at Luxarna Hotel & Spa:

🛏 King Suite (Room 206) — ₦50,000/night
Panoramic views, private sitting lounge, premium finishes.
Amenities: WiFi, AC, TV, Bathroom, Breakfast, Parking.

🛏 Queen Suite (Room 204) — ₦40,000/night
Modern elegance with warm Nigerian hospitality.
Amenities: WiFi, AC, TV, Bathroom, Breakfast.

🛏 Deluxe Room (Rooms 101,102,201,202,203,205) — ₦30,000/night
6 rooms available. Generous space with refined décor.
Amenities: WiFi, AC, TV, Bathroom.

🛏 Standard Room (Room 103) — ₦23,000/night
Smart, comfortable, excellent value.
Amenities: WiFi, AC, TV.

To book, visit our Rooms page or contact us at LuxarnaHotel@gmail.com or https://wa.me/2347049929851`,

  "What are your restaurant hours and what do you serve?":
`Our Restaurant & Karaoke Bar:

🍽 Dining Hours:
• Breakfast: 7:00 AM – 11:30 AM
• Lunch: 12:00 PM – 4:00 PM
• Dinner: 5:00 PM – 11:30 PM

🎤 Karaoke Bar:
• Hours: 5:00 PM – 2:00 AM
• Premium cocktails & drinks available all night

We serve delicious local dishes — taste Nigerian cuisine and channel your inner superstar! To book a table, reach us at LuxarnaHotel@gmail.com or https://wa.me/2347049929851`,

  "What spa services do you offer and what are the prices?":
`Our Luxarna Spa is open daily 9:00 AM – 9:00 PM.

💆 Full Body Massage — ₦40,000 (45 mins)
Signature massage combining traditional techniques with modern relaxation therapy.

✨ Facial — ₦30,000 (30 mins)
Premium facial for a radiant, glowing complexion.

💅 Pedicure — ₦7,500 (45–60 mins)
Relaxing foot soak, exfoliation, nail care & massage.

💅 Manicure — ₦7,500 (25–30 mins)
Professional nail shaping, cuticle care & hand massage.

Advance booking is recommended. To reserve your spot, contact us at LuxarnaHotel@gmail.com or https://wa.me/2347049929851`,
};

const GREETING = "Welcome to Luxarna Hotel & Spa! How can we make your stay exceptional? 🌟";

function renderContent(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-yellow-300 break-all">
        {part.includes("wa.me") ? "Chat on WhatsApp" : part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ChatBot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async (text: string) => {
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setShowQuick(false);

    // Check local knowledge base first (always works, no API needed)
    if (LOCAL_KB[text]) {
      setMessages(prev => [...prev, { role: "assistant", content: LOCAL_KB[text] }]);
      return;
    }

    // Free-form question — call OpenAI
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();

      if (!res.ok) {
        const isQuota = data.error?.includes("429") || data.error?.includes("quota");
        const fallback = isQuota
          ? "Our AI assistant is temporarily unavailable. Please contact us directly:\n📧 LuxarnaHotel@gmail.com\n💬 https://wa.me/2347049929851\n📞 +234 704 992 9851"
          : (data.error ?? "Sorry, something went wrong. Please try again.");
        setMessages(prev => [...prev, { role: "assistant", content: fallback }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "Sorry, I couldn't get a response." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please reach us at LuxarnaHotel@gmail.com or https://wa.me/2347049929851" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    sendMessage(trimmed);
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300"
        style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)" }}
        aria-label="Open chat"
        data-testid="button-chat-toggle"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{ width: "min(380px, calc(100vw - 32px))", height: "min(560px, calc(100vh - 120px))" }}
          data-testid="chat-window"
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg, #1a2a4a, #243560)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-serif font-bold text-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)" }}
            >
              L
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Luxie — AI Concierge</p>
              <p className="text-yellow-400 text-xs">Luxarna Hotel & Spa</p>
            </div>
            <span className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
              <span className="text-green-400 text-xs">Online</span>
            </span>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            style={{ background: "#0f1e35" }}
          >
            {/* Greeting bubble */}
            <div className="flex gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 mt-1"
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)" }}
              >
                L
              </div>
              <div
                className="rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-white max-w-[80%] leading-relaxed"
                style={{ background: "#1a3260" }}
              >
                {GREETING}
              </div>
            </div>

            {/* Quick action buttons */}
            {showQuick && (
              <div className="flex flex-col gap-2 pl-9">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="text-left text-sm px-3 py-2 rounded-xl border transition-colors"
                    style={{ borderColor: "#D4AF37", color: "#D4AF37", background: "transparent" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.15)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    data-testid={`button-quick-${action.label.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 mt-1"
                    style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)" }}
                  >
                    L
                  </div>
                )}
                <div
                  className="rounded-2xl px-4 py-2.5 text-sm max-w-[80%] leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#0f1e35", borderRadius: "18px 18px 4px 18px" }
                      : { background: "#1a3260", color: "#ffffff", borderRadius: "4px 18px 18px 18px" }
                  }
                >
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)" }}
                >
                  L
                </div>
                <div
                  className="rounded-2xl px-4 py-3 flex items-center gap-1"
                  style={{ background: "#1a3260" }}
                >
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-2 h-2 rounded-full"
                      style={{ background: "#D4AF37", animation: `bounce 1s ${delay}ms infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 shrink-0"
            style={{ background: "#1a2a4a", borderTop: "1px solid #2a3a5a" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Luxie anything…"
              className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none py-1"
              disabled={loading}
              data-testid="input-chat"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
              style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", border: "none" }}
              data-testid="button-chat-send"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            </Button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
