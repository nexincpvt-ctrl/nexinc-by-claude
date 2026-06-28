"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "../landing.css";

// Ultimate models list matching components/DashboardClient.js
const ultimateModels = [
  { key: "mistral-large", label: "Mistral Large 3 (Mistral AI)", provider: "mistral", providerModelId: "mistral-large", tier: "ultimate" },
  { key: "mistral-large-3", label: "Mistral Large 3 (Mistral AI)", provider: "mistral", providerModelId: "mistral-large-3", tier: "ultimate" },
  { key: "mistral-medium-3.5", label: "Mistral Medium 3.5 (Mistral AI)", provider: "mistral", providerModelId: "mistral-medium-3.5", tier: "ultimate" },
  { key: "mistral-small-4", label: "Mistral Small 4 (Mistral AI)", provider: "mistral", providerModelId: "mistral-small-4", tier: "ultimate" },
  { key: "gpt-5.5", label: "GPT-5.5 (OpenAI)", provider: "openai", providerModelId: "gpt-5.5", tier: "ultimate" },
  { key: "gpt-5.5-pro", label: "GPT-5.5 Pro (OpenAI)", provider: "openai", providerModelId: "gpt-5.5-pro", tier: "ultimate" },
  { key: "gpt-5.4", label: "GPT-5.4 (OpenAI)", provider: "openai", providerModelId: "gpt-5.4", tier: "ultimate" },
  { key: "gpt-5.4-pro", label: "GPT-5.4 Pro (OpenAI)", provider: "openai", providerModelId: "gpt-5.4-pro", tier: "ultimate" },
  { key: "gpt-5.4-mini", label: "GPT-5.4 Mini (OpenAI)", provider: "openai", providerModelId: "gpt-5.4-mini", tier: "ultimate" },
  { key: "gpt-5.4-nano", label: "GPT-5.4 Nano (OpenAI)", provider: "openai", providerModelId: "gpt-5.4-nano", tier: "ultimate" },
  { key: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Google)", provider: "gemini", providerModelId: "gemini-2.5-pro", tier: "ultimate" },
  { key: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Google)", provider: "gemini", providerModelId: "gemini-2.5-flash", tier: "ultimate" },
  { key: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (Google)", provider: "gemini", providerModelId: "gemini-2.5-flash-lite", tier: "ultimate" },
  { key: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Google)", provider: "gemini", providerModelId: "gemini-3.5-flash", tier: "ultimate" },
  { key: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (Google)", provider: "gemini", providerModelId: "gemini-3.1-flash-lite", tier: "ultimate" },
  { key: "gemini-3.1-flash-live-preview", label: "Gemini 3.1 Flash Live Preview (Google)", provider: "gemini", providerModelId: "gemini-3.1-flash-live-preview", tier: "ultimate" },
  { key: "gemini-live-2.5-flash-native-audio", label: "Gemini Live 2.5 Flash Native Audio (Google)", provider: "gemini", providerModelId: "gemini-live-2.5-flash-native-audio", tier: "ultimate" },
  { key: "gemini-2.5-flash-tts", label: "Gemini 2.5 Flash TTS (Google)", provider: "gemini", providerModelId: "gemini-2.5-flash-tts", tier: "ultimate" },
  { key: "gemini-2.5-pro-tts", label: "Gemini 2.5 Pro TTS (Google)", provider: "gemini", providerModelId: "gemini-2.5-pro-tts", tier: "ultimate" },
  { key: "gpt-4o", label: "GPT-4o (OpenAI / ChatGPT)", provider: "openai", providerModelId: "gpt-4o", tier: "ultimate" },
  { key: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet (Anthropic)", provider: "anthropic", providerModelId: "claude-3-5-sonnet-latest", tier: "ultimate" },
  { key: "perplexity-sonar", label: "Sonar Large (Perplexity)", provider: "perplexity", providerModelId: "sonar", tier: "ultimate" },
  { key: "deepseek-r1", label: "DeepSeek R1 (DeepSeek)", provider: "deepseek", providerModelId: "deepseek-reasoner", tier: "ultimate" },
  { key: "custom-cloud-gpu", label: "Custom Cloud GPU Model", provider: "mock", providerModelId: "custom-cloud-gpu", tier: "ultimate" },
  { key: "my-local-model", label: "My Local Model", provider: "mock", providerModelId: "my-local-model", tier: "ultimate" },
];

export default function ModelsCatalogPage() {
  const particleCanvasRef = useRef(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to map model key to tags/desc
  const getModelTagsAndDesc = (m) => {
    let desc = "High-performance AI model.";
    let tags = ["General"];

    const nameLower = (m.label || m.key).toLowerCase();
    const providerLower = (m.provider || "").toLowerCase();

    if (providerLower.includes("gemini") || nameLower.includes("gemini")) {
      desc = "Google's flagship multimodal reasoning model, strong at long-context and code.";
      tags = ["Vision", "2M ctx", "Code"];
    } else if (providerLower.includes("openai") || nameLower.includes("gpt")) {
      desc = "OpenAI's high-intelligence general-purpose model.";
      tags = ["Vision", "Tools", "128K ctx"];
    } else if (providerLower.includes("anthropic") || nameLower.includes("claude")) {
      desc = "Anthropic's state-of-the-art model for complex reasoning and writing.";
      tags = ["Reasoning", "Writing", "200k ctx"];
    } else if (providerLower.includes("perplexity") || nameLower.includes("sonar")) {
      desc = "Perplexity's search-grounded model for fast answers.";
      tags = ["Search", "Fast"];
    } else if (providerLower.includes("deepseek") || nameLower.includes("deepseek")) {
      desc = "DeepSeek's advanced reasoning model with deep search capabilities.";
      tags = ["Reasoning", "Math", "Search"];
    } else if (providerLower.includes("mistral") || nameLower.includes("mistral")) {
      desc = "Efficient European model, strong multilingual support.";
      tags = ["Multilingual", "Fast"];
    } else if (providerLower.includes("groq") || nameLower.includes("llama")) {
      desc = "Meta's open-weight model, optimized for speed.";
      tags = ["Open", "Fast", "Code"];
    }
    return { desc, tags };
  };

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        // merge
        const combined = [...(data.freeModels || []), ...ultimateModels];
        setModels(combined);
      } catch (err) {
        console.error("Error loading free models:", err);
        setModels(ultimateModels);
      } finally {
        setLoading(false);
      }
    }
    loadModels();
  }, []);

  useEffect(() => {
    // Interactive mouse glow particles
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    let particles = [];
    const T = "46,232,165";

    const initParticles = () => {
      particles = [];
      const N = Math.floor((W * H) / 22000);
      for (let i = 0; i < N; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.2 + 0.4,
          a: Math.random() * 0.5 + 0.15,
        });
      }
    };

    initParticles();

    const handleResize = () => {
      if (canvas) {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        initParticles();
      }
    };
    window.addEventListener("resize", handleResize);

    let mx = W / 2;
    let my = H / 2;
    const handleMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    document.addEventListener("mousemove", handleMouseMove);

    let animId;

    const drawParticles = () => {
      ctx.clearRect(0, 0, W, H);

      // Mouse glow
      const gr = ctx.createRadialGradient(mx, my, 0, mx, my, 280);
      gr.addColorStop(0, `rgba(${T},0.06)`);
      gr.addColorStop(1, "transparent");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          const f = (((100 - dist) / 100) * 0.35);
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 1.0) {
          p.vx /= spd;
          p.vy /= spd;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${T},${p.a})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d2 = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
          if (d2 < 12000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${T},${(1 - d2 / 12000) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(drawParticles);
    };

    drawParticles();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Group models by provider
  const grouped = {};
  models.forEach((m) => {
    const prov = (m.provider || "other").toLowerCase();
    if (!grouped[prov]) grouped[prov] = [];
    grouped[prov].push(m);
  });

  const providerLabels = {
    gemini: "Google Gemini",
    openai: "OpenAI",
    anthropic: "Anthropic Claude",
    deepseek: "DeepSeek",
    mistral: "Mistral AI",
    groq: "Meta Llama (Groq)",
    nvidia: "NVIDIA Nemotron",
    perplexity: "Perplexity AI",
    openrouter: "OpenRouter",
    mock: "Custom & Local",
    other: "Others",
  };

  const providerOrder = [
    "gemini",
    "openai",
    "anthropic",
    "deepseek",
    "mistral",
    "groq",
    "perplexity",
    "nvidia",
    "openrouter",
    "mock",
    "other",
  ];

  const sortedProviders = Object.keys(grouped).sort((a, b) => {
    let indexA = providerOrder.indexOf(a);
    let indexB = providerOrder.indexOf(b);
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    return indexA - indexB;
  });

  // Spotlight card effects
  const cardRefs = useRef({});
  const handleMouseMove = (e, key) => {
    const card = cardRefs.current[key];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(46,232,165,0.06) 0%, var(--card2) 60%)`;
  };

  const handleMouseLeave = (key) => {
    const card = cardRefs.current[key];
    if (!card) return;
    card.style.background = "";
  };

  return (
    <div className="landing-body" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Background elements */}
      <div id="video-bg" style={{ background: "var(--dark)" }}>
        <div id="video-overlay"></div>
      </div>
      <canvas ref={particleCanvasRef} id="bg-canvas"></canvas>

      {/* Nav */}
      <nav>
        <Link href="/" className="logo">
          <div className="logo-icon">
            <span></span>
          </div>
          NEXINC
        </Link>
        <ul className="nav-links">
          <li>
            <Link href="/#models">Models</Link>
          </li>
          <li>
            <Link href="/#features">Features</Link>
          </li>
          <li>
            <Link href="/#terminal">Terminal</Link>
          </li>
          <li>
            <Link href="/pricing">Pricing</Link>
          </li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div className="nav-status">
            <div className="status-dot"></div>
            US-EAST-1A · 99.98% UPTIME
          </div>
          <Link href="/login" className="nav-cta">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Page Header */}
      <section className="section-pad" style={{ paddingBottom: "20px", paddingTop: "140px", zIndex: 10 }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div className="section-label">// Model Catalog</div>
          <h1 className="section-title" style={{ fontSize: "clamp(36px, 5vw, 68px)", marginBottom: "20px" }}>
            Explore the AI Core
          </h1>
          <p className="section-sub" style={{ margin: "0 auto 40px", maxWidth: "600px" }}>
            NEXINC brings 40+ dynamic standard and premium reasoning, coding, and multilingual models into one unified terminal space.
          </p>
        </div>
      </section>

      {/* Models List grouped by Provider */}
      <main style={{ flex: 1, zIndex: 10, maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "0 24px 100px" }}>
        {loading ? (
          <div style={{ textAlign: "center", fontFamily: "var(--mono)", color: "var(--muted)", padding: "80px 0" }}>
            CONNECTING INTERFACE...
          </div>
        ) : (
          sortedProviders.map((prov) => {
            const list = grouped[prov];
            const label = providerLabels[prov] || (prov.charAt(0).toUpperCase() + prov.slice(1));
            return (
              <div key={prov} style={{ marginBottom: "60px" }}>
                <h2
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "var(--teal)",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "10px",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ◆ {label}
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {list.map((m) => {
                    const { desc, tags } = getModelTagsAndDesc(m);
                    const isPremium = m.tier === "ultimate";
                    return (
                      <Link
                        href={`/models/${m.key}`}
                        key={m.key}
                        ref={(el) => (cardRefs.current[m.key] = el)}
                        onMouseMove={(e) => handleMouseMove(e, m.key)}
                        onMouseLeave={() => handleMouseLeave(m.key)}
                        className="model-card"
                        style={{
                          textDecoration: "none",
                          border: "1px solid var(--border)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          minHeight: "180px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>
                              ID: {m.key}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--mono)",
                                fontSize: "9px",
                                textTransform: "uppercase",
                                padding: "2px 6px",
                                border: `1px solid ${isPremium ? "#FF6B5C" : "var(--teal)"}`,
                                color: isPremium ? "#FF6B5C" : "var(--teal)",
                              }}
                            >
                              {isPremium ? "Premium" : "Live"}
                            </span>
                          </div>
                          <h3 className="model-name" style={{ fontSize: "18px", color: "var(--text)" }}>
                            {m.label || m.key}
                          </h3>
                          <p className="model-desc" style={{ fontSize: "12.5px" }}>
                            {desc}
                          </p>
                        </div>
                        <div className="model-tags">
                          {tags.map((tag) => (
                            <span key={tag} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: "auto" }}>
        <div className="footer-copy">© 2026 NEXINC. ALL RIGHTS RESERVED.</div>
        <div className="footer-copy" style={{ display: "flex", gap: "32px" }}>
          <a href="#" style={{ color: "var(--muted)", textDecoration: "none", fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.08em" }}>DOCS</a>
          <a href="#" style={{ color: "var(--muted)", textDecoration: "none", fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.08em" }}>STATUS</a>
          <a href="#" style={{ color: "var(--muted)", textDecoration: "none", fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.08em" }}>PRIVACY</a>
        </div>
        <div className="footer-status">
          <div className="status-dot"></div>
          RUNTIME NOMINAL · NODE GEMINI-2.5-PRO
        </div>
      </footer>
    </div>
  );
}
