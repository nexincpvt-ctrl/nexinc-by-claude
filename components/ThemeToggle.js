"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const themes = [
  { id: "default", name: "🍊 Default Dark", label: "Default" },
  { id: "partyrock", name: "🎈 Partyrock", label: "Partyrock" },
  { id: "bw", name: "🕶️ Stark B&W", label: "Stark B&W" },
  { id: "wb", name: "⬜ Stark W&B", label: "Stark W&B" },
  { id: "wg", name: "🌿 Mint Green", label: "Mint Green" },
  { id: "cyberpunk", name: "👾 Cyberpunk", label: "Cyberpunk" },
  { id: "matrix", name: "⚡ Matrix", label: "Matrix" },
  { id: "retro", name: "📺 Retro Amber", label: "Retro" }
];

export default function ThemeToggle({ isInline = false }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("default");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "default";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (savedTheme === "wg" || savedTheme === "wb" || savedTheme === "partyrock") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  if (pathname === "/dashboard" && !isInline) {
    return null;
  }

  const handleSelectTheme = (themeId) => {
    setTheme(themeId);
    localStorage.setItem("theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    if (themeId === "wg" || themeId === "wb" || themeId === "partyrock") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    setIsOpen(false);
  };

  return (
    <div className={isInline ? "relative" : "fixed top-3 right-4 sm:right-6 z-50"}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 px-4.5 bg-brand-card border-brand-w border-brand-dark rounded-brand-20 shadow-brand-2xl hover:shadow-brand-glow-30 hover:-translate-y-0.5 active:translate-y-px transition-all duration-150 flex items-center justify-center text-xs font-black cursor-pointer select-none text-brand-text gap-2"
        aria-label="Select theme"
        title="Change theme"
      >
        <span>🎨 Theme: {themes.find(t => t.id === theme)?.label || "Default"}</span>
        <svg 
          className={`w-3.5 h-3.5 text-brand-text transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth="3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-brand-card border-brand-w border-brand-dark rounded-brand-20 shadow-brand-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? "bg-brand-primary/10 text-brand-primary font-black" 
                      : "text-brand-text hover:bg-brand-primary/5 hover:text-brand-primary"
                  }`}
                >
                  <span>{t.name}</span>
                  {isSelected && <span className="text-brand-primary font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
