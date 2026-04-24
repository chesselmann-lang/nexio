"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Theme = "system" | "light" | "dark";

export default function AppearancePage() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("system");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  useEffect(() => {
    const stored = localStorage.getItem("nexio-theme") as Theme | null;
    if (stored) setTheme(stored);
    const storedFont = localStorage.getItem("nexio-fontsize") as "small" | "medium" | "large" | null;
    if (storedFont) setFontSize(storedFont);
  }, []);

  function applyTheme(t: Theme) {
    setTheme(t);
    localStorage.setItem("nexio-theme", t);
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (t === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("dark", "light");
    }
    // Trigger nexio theme vars reload
    root.setAttribute("data-theme", t);
  }

  function applyFontSize(s: "small" | "medium" | "large") {
    setFontSize(s);
    localStorage.setItem("nexio-fontsize", s);
    const sizes = { small: "14px", medium: "16px", large: "18px" };
    document.documentElement.style.fontSize = sizes[s];
  }

  const themeOptions: { key: Theme; label: string; icon: string; desc: string }[] = [
    { key: "system", label: "System", icon: "📱", desc: "Wie Geräteeinstellung" },
    { key: "light", label: "Hell", icon: "☀️", desc: "Immer heller Modus" },
    { key: "dark", label: "Dunkel", icon: "🌙", desc: "Immer dunkler Modus" },
  ];

  const fontOptions: { key: "small" | "medium" | "large"; label: string; size: string }[] = [
    { key: "small", label: "Klein", size: "text-sm" },
    { key: "medium", label: "Mittel", size: "text-base" },
    { key: "large", label: "Groß", size: "text-lg" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--foreground-3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Erscheinungsbild</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Theme */}
        <div>
          <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--foreground-3)" }}>Farbschema</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            {themeOptions.map((opt, i) => (
              <button key={opt.key} onClick={() => applyTheme(opt.key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <span className="text-xl w-8 text-center">{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-3)" }}>{opt.desc}</p>
                </div>
                {theme === opt.key && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--nexio-green)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div>
          <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--foreground-3)" }}>Schriftgröße</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            {fontOptions.map((opt, i) => (
              <button key={opt.key} onClick={() => applyFontSize(opt.key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                <span className={`${opt.size} font-medium w-8 text-center`} style={{ color: "var(--nexio-green)" }}>Aa</span>
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>{opt.label}</span>
                {fontSize === opt.key && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--nexio-green)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--foreground-3)" }}>Vorschau</p>
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surface)" }}>
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "var(--nexio-green)" }}>N</div>
              <div className="px-3 py-2 rounded-2xl rounded-bl-sm max-w-[70%]"
                style={{ background: "var(--background)" }}>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>Hallo! Wie geht's?</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--foreground-3)" }}>14:20</p>
              </div>
            </div>
            <div className="flex items-end gap-2 justify-end">
              <div className="px-3 py-2 rounded-2xl rounded-br-sm max-w-[70%]"
                style={{ background: "var(--nexio-green)" }}>
                <p className="text-sm text-white">Super, danke! 😊</p>
                <p className="text-xs mt-0.5 text-white/70">14:21</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
