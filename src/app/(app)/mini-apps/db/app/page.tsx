"use client";
import { useState } from "react";

const STATIONS = ["Duisburg Hbf", "Düsseldorf Hbf", "Köln Hbf", "Frankfurt(M) Hbf", "Berlin Hbf", "Hamburg Hbf", "München Hbf", "Stuttgart Hbf", "Dortmund Hbf", "Essen Hbf"];

function randomTime(base: number, offset: number) {
  const h = Math.floor((base + offset) / 60);
  const m = (base + offset) % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

interface Connection { id: number; dep: string; arr: string; duration: string; changes: number; track: string; price: string; type: string; }

export default function DBApp() {
  const [from, setFrom] = useState("Duisburg Hbf");
  const [to, setTo] = useState("Köln Hbf");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [results, setResults] = useState<Connection[] | null>(null);
  const [loading, setLoading] = useState(false);

  function search() {
    if (from === to) { alert("Start und Ziel dürfen nicht gleich sein!"); return; }
    setLoading(true);
    setTimeout(() => {
      const now = new Date();
      const baseMin = now.getHours() * 60 + now.getMinutes();
      const conns: Connection[] = Array.from({ length: 5 }, (_, i) => {
        const dep = baseMin + i * 32 + Math.floor(Math.random() * 10);
        const dur = 45 + Math.floor(Math.random() * 60);
        return {
          id: i,
          dep: randomTime(0, dep),
          arr: randomTime(0, dep + dur),
          duration: `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, "0")} h`,
          changes: i % 3 === 0 ? 0 : i % 2,
          track: `${Math.floor(Math.random() * 12) + 1}`,
          price: `${(19 + i * 8 + Math.floor(Math.random() * 10)).toFixed(2)} €`,
          type: ["ICE", "IC", "RE", "RB", "S"][i % 5],
        };
      });
      setResults(conns);
      setLoading(false);
    }, 1000);
  }

  const TYPE_COLORS: Record<string, string> = { ICE: "#e63946", IC: "#e63946", RE: "#1d3557", RB: "#457b9d", S: "#2a9d8f" };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#f8f9fa", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: "#e63946", padding: "16px", color: "white" }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🚂 DB Verbindungen</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.85 }}>Demo-Modus · Echte Verbindungen auf bahn.de</p>
      </div>

      <div style={{ padding: 16, background: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>VON</label>
          <select value={from} onChange={(e) => setFrom(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14 }}>
            {STATIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>NACH</label>
          <select value={to} onChange={(e) => setTo(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14 }}>
            {STATIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>DATUM</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <button onClick={search} disabled={loading}
          style={{ width: "100%", padding: "12px", background: "#e63946", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          {loading ? "Suche läuft…" : "Verbindungen suchen"}
        </button>
      </div>

      <div style={{ padding: 16, overflowY: "auto" }}>
        {results && (
          <>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              {from} → {to} · {new Date(date).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}
            </p>
            {results.map((c) => (
              <div key={c.id} style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ background: TYPE_COLORS[c.type] ?? "#333", color: "white", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, marginRight: 8 }}>
                    {c.type}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{c.dep}</span>
                  <span style={{ margin: "0 8px", color: "#9ca3af" }}>→</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{c.arr}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: "#e63946", fontSize: 16 }}>{c.price}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#6b7280" }}>
                  <span>⏱ {c.duration}</span>
                  <span>{c.changes === 0 ? "✅ Direkt" : `🔄 ${c.changes}× Umsteigen`}</span>
                  <span>🚉 Gleis {c.track}</span>
                </div>
              </div>
            ))}
            <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>
              Demo-Daten · Für echte Buchungen: bahn.de
            </p>
          </>
        )}
      </div>
    </div>
  );
}
