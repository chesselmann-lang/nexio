"use client";
import { useState } from "react";

interface Expense { id: number; desc: string; amount: number; paidBy: string; }
interface Person { name: string; }

export default function SplittrApp() {
  const [people, setPeople] = useState<Person[]>([{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, desc: "Restaurant", amount: 60, paidBy: "Alice" },
    { id: 2, desc: "Taxi", amount: 24, paidBy: "Bob" },
  ]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newPaidBy, setNewPaidBy] = useState("Alice");
  const [tab, setTab] = useState<"expenses" | "balances">("expenses");

  function addPerson() {
    if (!newName.trim()) return;
    setPeople((p) => [...p, { name: newName.trim() }]);
    setNewName("");
  }

  function addExpense() {
    const amt = parseFloat(newAmount);
    if (!newDesc.trim() || isNaN(amt) || amt <= 0) return;
    setExpenses((e) => [...e, { id: Date.now(), desc: newDesc, amount: amt, paidBy: newPaidBy }]);
    setNewDesc("");
    setNewAmount("");
  }

  // Calculate balances
  const balances: Record<string, number> = {};
  people.forEach((p) => (balances[p.name] = 0));
  expenses.forEach((e) => {
    const share = e.amount / people.length;
    people.forEach((p) => {
      if (p.name === e.paidBy) balances[p.name] += e.amount - share;
      else balances[p.name] -= share;
    });
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#f0fdf4", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: "#07c160", padding: "16px", color: "white" }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>💸 Splittr</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.85 }}>Ausgaben fair aufteilen</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "white", borderBottom: "1px solid #e5e7eb" }}>
        {(["expenses", "balances"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: "12px", fontSize: 13, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
              color: tab === t ? "#07c160" : "#9ca3af",
              borderBottom: tab === t ? "2px solid #07c160" : "2px solid transparent" }}>
            {t === "expenses" ? "Ausgaben" : "Abrechnung"}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
        {tab === "expenses" ? (
          <>
            {/* People */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Personen</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {people.map((p) => (
                  <span key={p.name} style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                    {p.name}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name hinzufügen"
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid #d1fae5", fontSize: 13 }} />
                <button onClick={addPerson}
                  style={{ padding: "8px 14px", background: "#07c160", color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
                  +
                </button>
              </div>
            </div>

            {/* Add expense */}
            <div style={{ background: "white", borderRadius: 16, padding: 14, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>Neue Ausgabe</p>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Beschreibung"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13, marginBottom: 8, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Betrag €"
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }} />
                <select value={newPaidBy} onChange={(e) => setNewPaidBy(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}>
                  {people.map((p) => <option key={p.name}>{p.name}</option>)}
                </select>
              </div>
              <button onClick={addExpense}
                style={{ width: "100%", padding: "10px", background: "#07c160", color: "white", border: "none", borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Hinzufügen
              </button>
            </div>

            {/* Expense list */}
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>
              Gesamt: {total.toFixed(2)} €
            </p>
            {expenses.map((e) => (
              <div key={e.id} style={{ background: "white", borderRadius: 12, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{e.desc}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>bezahlt von {e.paidBy}</p>
                </div>
                <span style={{ fontWeight: 700, color: "#07c160", fontSize: 15 }}>{e.amount.toFixed(2)} €</span>
              </div>
            ))}
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Wer bekommt wie viel? Basierend auf {expenses.length} Ausgaben.
            </p>
            {Object.entries(balances).map(([name, balance]) => (
              <div key={name} style={{ background: "white", borderRadius: 12, padding: "12px 16px", marginBottom: 10, display: "flex", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                    {balance >= 0 ? "bekommt zurück" : "schuldet noch"}
                  </p>
                </div>
                <span style={{ fontWeight: 700, fontSize: 16, color: balance >= 0 ? "#07c160" : "#ef4444" }}>
                  {balance >= 0 ? "+" : ""}{balance.toFixed(2)} €
                </span>
              </div>
            ))}
            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "10px 14px", textAlign: "center", marginTop: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#16a34a" }}>💡 Tipp: Sende Geld direkt über Nexio Pay</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
