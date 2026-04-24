"use client";
import { useState } from "react";

const SERVICES = [
  { id: 1, name: "Personalausweis beantragen", duration: "15 Min", icon: "🪪" },
  { id: 2, name: "Reisepass beantragen", duration: "20 Min", icon: "📗" },
  { id: 3, name: "Fahrzeug anmelden", duration: "20 Min", icon: "🚗" },
  { id: 4, name: "Ummeldung (Wohnsitz)", duration: "10 Min", icon: "🏠" },
  { id: 5, name: "Führungszeugnis", duration: "5 Min", icon: "📜" },
  { id: 6, name: "Gewerbeanmeldung", duration: "30 Min", icon: "🏢" },
];

const LOCATIONS = ["Bürgeramt Mitte", "Bürgeramt Duissern", "Bürgeramt Rheinhausen", "Bürgeramt Homberg"];

const TIMES = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];

export default function BuergerterminApp() {
  const [step, setStep] = useState<"service" | "location" | "date" | "confirm" | "done">("service");
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: "#1d4ed8", padding: "16px", color: "white" }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🏛 Bürgeramt-Termin</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.85 }}>Duisburg · Demo-Modus</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 16px" }}>
        {["Dienst", "Amt", "Termin", "Bestätigung"].map((s, i) => {
          const steps = ["service", "location", "date", "confirm"];
          const active = steps.indexOf(step) >= i;
          return (
            <div key={s} style={{ flex: 1, textAlign: "center", padding: "10px 0", fontSize: 11, fontWeight: 600,
              color: active ? "#1d4ed8" : "#9ca3af", borderBottom: active ? "2px solid #1d4ed8" : "2px solid transparent" }}>
              {s}
            </div>
          );
        })}
      </div>

      <div style={{ padding: 16, overflowY: "auto", maxHeight: "calc(100vh - 110px)" }}>
        {step === "service" && (
          <>
            <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, marginBottom: 12 }}>Welchen Dienst benötigst du?</p>
            {SERVICES.map((s) => (
              <button key={s.id} onClick={() => { setSelectedService(s); setStep("location"); }}
                style={{ width: "100%", background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 14px",
                  marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111" }}>{s.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>ca. {s.duration}</p>
                </div>
              </button>
            ))}
          </>
        )}

        {step === "location" && (
          <>
            <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, marginBottom: 4 }}>Dienst: {selectedService?.name}</p>
            <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, marginBottom: 12 }}>Welches Bürgeramt?</p>
            {LOCATIONS.map((l) => (
              <button key={l} onClick={() => { setSelectedLocation(l); setStep("date"); }}
                style={{ width: "100%", background: "white", border: `1px solid ${selectedLocation === l ? "#1d4ed8" : "#e5e7eb"}`,
                  borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#111" }}>
                📍 {l}
              </button>
            ))}
          </>
        )}

        {step === "date" && (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Wann möchtest du kommen?</p>
            <input type="date" min={minDate} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
            {selectedDate && (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Verfügbare Zeiten:</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {TIMES.map((t) => (
                    <button key={t} onClick={() => setSelectedTime(t)}
                      style={{ padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
                        background: selectedTime === t ? "#1d4ed8" : "#f3f4f6", color: selectedTime === t ? "white" : "#374151" }}>
                      {t}
                    </button>
                  ))}
                </div>
                {selectedTime && (
                  <button onClick={() => setStep("confirm")}
                    style={{ width: "100%", marginTop: 16, padding: "12px", background: "#1d4ed8", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                    Weiter
                  </button>
                )}
              </>
            )}
          </>
        )}

        {step === "confirm" && (
          <>
            <div style={{ background: "white", borderRadius: 16, padding: "14px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 15 }}>Terminübersicht</p>
              {[
                ["Dienst", selectedService?.name],
                ["Amt", selectedLocation],
                ["Datum", new Date(selectedDate).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })],
                ["Uhrzeit", selectedTime + " Uhr"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: "#6b7280", minWidth: 60 }}>{k}:</span>
                  <span style={{ fontWeight: 600, color: "#111" }}>{v}</span>
                </div>
              ))}
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vor- und Nachname *"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, marginBottom: 8, boxSizing: "border-box" }} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail-Adresse *"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
            <button onClick={() => { if (name && email) setStep("done"); }}
              disabled={!name || !email}
              style={{ width: "100%", padding: "12px", background: "#1d4ed8", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: !name || !email ? 0.5 : 1 }}>
              Termin buchen
            </button>
          </>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: "#111", marginBottom: 8 }}>Termin gebucht!</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Eine Bestätigung wird an <strong>{email}</strong> gesendet.
            </p>
            <div style={{ background: "#dbeafe", borderRadius: 14, padding: "14px", margin: "20px 0", textAlign: "left" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1d4ed8" }}>
                {selectedDate && new Date(selectedDate).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })} um {selectedTime} Uhr
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>{selectedLocation}</p>
            </div>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>Demo-Modus · Kein echter Termin gebucht</p>
          </div>
        )}
      </div>
    </div>
  );
}
