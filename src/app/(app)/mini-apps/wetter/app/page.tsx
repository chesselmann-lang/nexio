"use client";
import { useState, useEffect } from "react";

const CITIES = ["Duisburg", "Düsseldorf", "Köln", "Berlin", "Hamburg", "München", "Frankfurt", "Stuttgart"];

const CONDITIONS = [
  { icon: "☀️", label: "Sonnig", tempRange: [20, 32] },
  { icon: "⛅", label: "Teilbewölkt", tempRange: [15, 25] },
  { icon: "☁️", label: "Bewölkt", tempRange: [10, 20] },
  { icon: "🌧", label: "Regen", tempRange: [8, 15] },
  { icon: "⛈", label: "Gewitter", tempRange: [12, 20] },
  { icon: "🌤", label: "Heiter", tempRange: [18, 28] },
];

function fakeWeather(seed: number) {
  const cond = CONDITIONS[seed % CONDITIONS.length];
  const [lo, hi] = cond.tempRange;
  const temp = lo + Math.floor((seed * 7) % (hi - lo));
  return { ...cond, temp, humidity: 40 + (seed * 13) % 50, wind: 5 + (seed * 3) % 30 };
}

export default function WetterApp() {
  const [city, setCity] = useState("Duisburg");
  const [weather, setWeather] = useState(fakeWeather(3));
  const [forecast, setForecast] = useState<any[]>([]);

  useEffect(() => {
    const seed = city.charCodeAt(0) + city.charCodeAt(1);
    setWeather(fakeWeather(seed));
    const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    const today = new Date().getDay();
    setForecast(Array.from({ length: 7 }, (_, i) => ({
      day: days[(today + i) % 7],
      ...fakeWeather(seed + i * 17),
    })));
  }, [city]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "linear-gradient(180deg, #1e40af 0%, #3b82f6 100%)", minHeight: "100vh", maxWidth: 480, margin: "0 auto", color: "white" }}>
      {/* City selector */}
      <div style={{ padding: "16px 16px 0" }}>
        <select value={city} onChange={(e) => setCity(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.15)", color: "white", border: "none", fontSize: 15, fontWeight: 600 }}>
          {CITIES.map((c) => <option key={c} style={{ color: "#000" }}>{c}</option>)}
        </select>
      </div>

      {/* Current weather */}
      <div style={{ textAlign: "center", padding: "32px 16px 24px" }}>
        <div style={{ fontSize: 80 }}>{weather.icon}</div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1 }}>{weather.temp}°</div>
        <div style={{ fontSize: 18, opacity: 0.85, marginTop: 4 }}>{weather.label}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16, fontSize: 13, opacity: 0.8 }}>
          <span>💧 {weather.humidity}%</span>
          <span>💨 {weather.wind} km/h</span>
          <span>📍 {city}</span>
        </div>
      </div>

      {/* 7-day forecast */}
      <div style={{ background: "rgba(255,255,255,0.12)", margin: "0 12px", borderRadius: 20, padding: "12px 8px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", opacity: 0.7, textAlign: "center", marginBottom: 8 }}>
          7-Tage-Vorhersage
        </p>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {forecast.map((d, i) => (
            <div key={i} style={{ textAlign: "center", padding: "4px 2px" }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{d.day}</div>
              <div style={{ fontSize: 22 }}>{d.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{d.temp}°</div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 10, opacity: 0.5, padding: "16px 0" }}>
        Demo-Daten · DWD Deutscher Wetterdienst
      </p>
    </div>
  );
}
