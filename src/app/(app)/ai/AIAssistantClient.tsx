"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Session {
  id: string;
  title: string;
  last_message_at: string;
  message_count: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

// Pre-set AI personas inside Nexio
const PERSONAS = [
  { id: "assistant", label: "Nexio KI", icon: "✨", prompt: undefined },
  { id: "lawyer", label: "Rechtsberater", icon: "⚖️", prompt: "Du bist ein erfahrener deutscher Rechtsanwalt. Gib rechtliche Einschätzungen auf Basis deutschen Rechts, weise aber immer darauf hin, dass deine Antworten keine offizielle Rechtsberatung ersetzen." },
  { id: "doctor", label: "Gesundheit", icon: "🩺", prompt: "Du bist ein medizinischer Informations-Assistent. Erkläre medizinische Themen verständlich, weise immer auf einen Arztbesuch hin. Gib keine Diagnosen." },
  { id: "finance", label: "Finanzen", icon: "💰", prompt: "Du bist ein Finanzberater-Assistent. Erkläre Finanzthemen, DSGVO-konform, ohne konkrete Anlageempfehlungen zu geben." },
  { id: "translate", label: "Übersetzer", icon: "🌍", prompt: "Du bist ein professioneller Übersetzer. Übersetze Texte präzise zwischen allen Sprachen. Erkläre auf Wunsch Nuancen und Besonderheiten." },
  { id: "coach", label: "Coach", icon: "🎯", prompt: "Du bist ein persönlicher Coach für Produktivität und Selbstentwicklung. Hilf dem Nutzer, Ziele zu erreichen und bessere Gewohnheiten zu entwickeln." },
];

export default function AIAssistantClient({ sessions, userId }: { sessions: Session[]; userId: string }) {
  const supabase = createClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [showSessions, setShowSessions] = useState(false);
  const [allSessions, setAllSessions] = useState<Session[]>(sessions);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function newSession() {
    const { data } = await supabase
      .from("ai_sessions")
      .insert({
        user_id: userId,
        title: "Neues Gespräch",
        system_prompt: persona.prompt,
      })
      .select()
      .single();
    if (data) {
      setCurrentSessionId(data.id);
      setMessages([]);
      setAllSessions((prev) => [data, ...prev]);
      setShowSessions(false);
    }
  }

  async function loadSession(id: string) {
    setCurrentSessionId(id);
    setShowSessions(false);
    const { data } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("session_id", id)
      .order("created_at", { ascending: true });
    setMessages(
      (data ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
    );
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    if (!currentSessionId) await newSession();

    const sessionId = currentSessionId;
    if (!sessionId) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const assistantMsg: Message = { role: "assistant", content: "", streaming: true };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setSending(true);

    // Auto-rename session on first message
    if (messages.length === 0) {
      const title = input.trim().slice(0, 40);
      await supabase.from("ai_sessions").update({ title }).eq("id", sessionId);
      setAllSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, title } : s));
    }

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: userMsg.content,
        systemPrompt: persona.prompt,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const { text } = JSON.parse(data);
            accumulated += text;
            setMessages((prev) =>
              prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: accumulated } : m
              )
            );
          } catch {}
        }
      }
    }

    setMessages((prev) =>
      prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, streaming: false } : m
      )
    );
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex-none flex items-center gap-3 px-4 pt-safe border-b"
        style={{ height: "var(--header-height)", background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <button
          onClick={() => setShowSessions(!showSessions)}
          className="w-8 h-8 flex items-center justify-center"
          style={{ color: "var(--foreground-2)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            {persona.icon} {persona.label}
          </p>
          <p className="text-xs" style={{ color: "var(--foreground-3)" }}>KI-Assistent · Nexio</p>
        </div>
        <button onClick={newSession}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: "var(--nexio-green)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Persona Picker */}
      <div className="flex-none flex gap-2 px-3 py-2 overflow-x-auto border-b"
        style={{ borderColor: "var(--border)" }}>
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPersona(p)}
            className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: persona.id === p.id ? "var(--nexio-green)" : "var(--surface-2)",
              color: persona.id === p.id ? "white" : "var(--foreground-2)",
            }}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Session Drawer */}
      {showSessions && (
        <div
          className="absolute top-0 left-0 w-72 h-full z-30 flex flex-col border-r shadow-xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>Gespräche</span>
            <button onClick={() => setShowSessions(false)} style={{ color: "var(--foreground-3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <button
            onClick={newSession}
            className="mx-3 mt-3 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--nexio-green)", color: "white" }}
          >
            + Neues Gespräch
          </button>
          <div className="flex-1 overflow-y-auto mt-2">
            {allSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className="w-full px-4 py-3 text-left border-b hover:opacity-80"
                style={{
                  borderColor: "var(--border)",
                  background: s.id === currentSessionId ? "var(--surface-2)" : "transparent",
                }}
              >
                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--foreground-3)" }}>
                  {formatDistanceToNow(new Date(s.last_message_at), { locale: de, addSuffix: true })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Welcome state */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="text-5xl">{persona.icon}</div>
          <h2 className="text-xl font-bold text-center" style={{ color: "var(--foreground)" }}>
            {persona.label}
          </h2>
          <p className="text-sm text-center" style={{ color: "var(--foreground-3)" }}>
            {persona.id === "assistant"
              ? "Ich bin dein persönlicher KI-Assistent. Frage mich alles!"
              : `Spezialisiert auf ${persona.label}. Wie kann ich helfen?`}
          </p>
          {/* Quick prompts */}
          <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
            {["Was kannst du?", "Fasse das für mich zusammen", "Hilf mir beim Schreiben"].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); inputRef.current?.focus(); }}
                className="py-2.5 px-4 rounded-2xl text-sm text-left border"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground-2)" }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-none mr-2 mt-auto"
                  style={{ background: "var(--surface-2)" }}
                >
                  {persona.icon}
                </div>
              )}
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.role === "user" ? "var(--nexio-green)" : "var(--surface-2)",
                  color: msg.role === "user" ? "white" : "var(--foreground)",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                }}
              >
                {msg.content}
                {msg.streaming && (
                  <span className="inline-block w-1 h-4 ml-0.5 rounded-sm animate-pulse"
                    style={{ background: "var(--nexio-green)", verticalAlign: "middle" }} />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div
        className="flex-none flex items-end gap-2 px-3 py-2 pb-safe border-t"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="flex-1 rounded-2xl border px-3 py-2"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Nachricht an ${persona.label}…`}
            rows={1}
            className="w-full resize-none bg-transparent text-sm leading-5 focus:outline-none"
            style={{ color: "var(--foreground)", maxHeight: "120px" }}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-none mb-0.5 disabled:opacity-40 transition-opacity"
          style={{ background: "var(--nexio-green)" }}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
