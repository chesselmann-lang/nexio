"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

type Theme = "dark" | "light";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("nexio-theme");
  if (stored === "light") return "light";
  if (stored === "dark") return "dark";
  // system preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("nexio-theme", next);
    const root = document.documentElement;
    if (next === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
      className="w-9 h-9 flex items-center justify-center rounded-full"
      style={{
        background: "transparent",
        border: "none",
        color: "var(--foreground-3)",
        cursor: "pointer",
        transition: "color 0.15s",
      }}
    >
      {theme === "dark" ? (
        <SunIcon style={{ width: 20, height: 20 }} />
      ) : (
        <MoonIcon style={{ width: 20, height: 20 }} />
      )}
    </button>
  );
}
