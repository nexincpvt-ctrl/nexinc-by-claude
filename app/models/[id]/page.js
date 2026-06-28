"use client";

import Link from "next/link";
import React, { use, useEffect, useRef, useState } from "react";
import "../../landing.css";

// Comprehensive models database for detail page
const modelsDetailDb = {
  "gpt-5.5": {
    name: "GPT-5.5",
    provider: "OpenAI",
    tier: "ultimate",
    contextWindow: "128,000 tokens",
    maxOutput: "4,096 tokens",
    cost1kInput: "$0.005",
    cost1kOutput: "$0.015",
    description: "The latest flagship model from OpenAI, engineered for hyper-intelligent reasoning, logical processing, and multimodal interaction.",
    bestFor: "Complex mathematical solving, high-density code generation, agentic multi-step planning, and logical analysis.",
    releaseDate: "Q2 2026",
    status: "Premium Live"
  },
  "gpt-5.5-pro": {
    name: "GPT-5.5 Pro",
    provider: "OpenAI",
    tier: "ultimate",
    contextWindow: "128,000 tokens",
    maxOutput: "8,192 tokens",
    cost1kInput: "$0.015",
    cost1kOutput: "$0.045",
    description: "OpenAI's top-tier optimization model with extended computational cycles to deliver maximum accuracy on extremely hard instructions.",
    bestFor: "Academic scientific research, complex system refactoring, legal reasoning, and advanced data-science modeling.",
    releaseDate: "Q2 2026",
    status: "Premium Live"
  },
  "gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    provider: "Google",
    tier: "ultimate",
    contextWindow: "2,000,000 tokens",
    maxOutput: "8,192 tokens",
    cost1kInput: "$0.007",
    cost1kOutput: "$0.021",
    description: "Google's most advanced reasoning model, featuring a massive context window capable of ingesting whole codebases, video hours, or thousands of documents.",
    bestFor: "Full repository analysis, cross-document citation synthesis, audio/video analysis, and high-context translation.",
    releaseDate: "Q1 2026",
    status: "Premium Live"
  },
  "claude-3.5-sonnet": {
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    tier: "ultimate",
    contextWindow: "200,000 tokens",
    maxOutput: "8,192 tokens",
    cost1kInput: "$0.003",
    cost1kOutput: "$0.015",
    description: "Anthropic's industry benchmark model, famous for its high-fidelity natural tone, logical coding skills, and visual UI wireframe rendering.",
    bestFor: "Premium technical writing, UI design analysis, heavy coding tasks, customer service workflows, and nuanced translation.",
    releaseDate: "Late 2025",
    status: "Premium Live"
  },
  "llama-3.3-70b-reasoning": {
    name: "Llama 3.3 70B",
    provider: "Meta AI",
    tier: "free",
    contextWindow: "128,000 tokens",
    maxOutput: "4,096 tokens",
    cost1kInput: "Free",
    cost1kOutput: "Free",
    description: "Meta's flagship open-weight model, providing near-frontier performance, exceptional flexibility, and incredibly fast generation speeds.",
    bestFor: "General chatting, quick scripts, content summarization, and cost-effective automation pipelines.",
    releaseDate: "Q4 2025",
    status: "Standard Live"
  },
  "deepseek-r1": {
    name: "DeepSeek R1",
    provider: "DeepSeek",
    tier: "ultimate",
    contextWindow: "128,000 tokens",
    maxOutput: "8,192 tokens",
    cost1kInput: "$0.00055",
    cost1kOutput: "$0.00219",
    description: "A state-of-the-art chain-of-thought reasoning model from DeepSeek. Performs extensive mathematical and logical deduction before responding.",
    bestFor: "Deep mathematics, competitive programming, logical puzzles, and highly detailed reasoning walkthroughs.",
    releaseDate: "Q1 2026",
    status: "Premium Live"
  },
  "custom-cloud-gpu": {
    name: "Custom Cloud GPU Model",
    provider: "xAI",
    tier: "ultimate",
    contextWindow: "64,000 tokens",
    maxOutput: "4,096 tokens",
    cost1kInput: "$0.002",
    cost1kOutput: "$0.006",
    description: "Dedicated GPU clusters running Grok 3 with live internet grounding and search engine integration.",
    bestFor: "Real-time query grounding, live stock trends, tech news extraction, and current events checking.",
    releaseDate: "Q1 2026",
    status: "Premium Live"
  }
};

export default function ModelDetailPage({ params }) {
  const unwrappedParams = use(params);
  const modelId = unwrappedParams.id;
  const particleCanvasRef = useRef(null);

  // Fetch model data from DB or mock fallback
  const model = modelsDetailDb[modelId] || {
    name: modelId.toUpperCase(),
    provider: "Unknown Provider",
    tier: "free",
    contextWindow: "128,000 tokens",
    maxOutput: "4,096 tokens",
    cost1kInput: "Varies",
    cost1kOutput: "Varies",
    description: "Unified model deployment registered on the NEXINC network grid.",
    bestFor: "General tasks, content processing, and API testing.",
    releaseDate: "N/A",
    status: "Active"
  };

  useEffect(() => {
    // Interactive mouse particles
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

  const isPremium = model.tier === "ultimate";

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
            <Link href="/models">Catalog</Link>
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

      {/* Detail Core Content */}
      <main style={{ flex: 1, zIndex: 10, maxWidth: "900px", width: "100%", margin: "0 auto", padding: "140px 24px 100px" }}>
        {/* Back navigation link */}
        <Link
          href="/models"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--mono)",
            fontSize: "11px",
            color: "var(--teal)",
            textDecoration: "none",
            textTransform: "uppercase",
            marginBottom: "32px",
            letterSpacing: "0.08em"
          }}
        >
          ← Back to Catalog
        </Link>

        {/* Specs window */}
        <div
          style={{
            border: "1px solid var(--border)",
            background: "var(--card)",
            padding: "48px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                // {model.provider}
              </span>
              <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 700, margin: "6px 0 0", color: "var(--text)" }}>
                {model.name}
              </h1>
            </div>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                textTransform: "uppercase",
                padding: "4px 12px",
                border: `1px solid ${isPremium ? "#FF6B5C" : "var(--teal)"}`,
                color: isPremium ? "#FF6B5C" : "var(--teal)",
              }}
            >
              {model.status}
            </span>
          </div>

          <p style={{ fontSize: "16px", lineHeight: "1.7", color: "var(--text-dim)", marginBottom: "36px" }}>
            {model.description}
          </p>

          {/* Details Table */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px", marginBottom: "36px" }}>
            <h3 style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text)", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.08em" }}>
              Technical Specifications
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <span style={{ display: "block", fontSize: "10px", fontFamily: "var(--mono)", color: "var(--muted)", textTransform: "uppercase" }}>Context Window</span>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", fontFamily: "var(--mono)" }}>{model.contextWindow}</span>
              </div>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <span style={{ display: "block", fontSize: "10px", fontFamily: "var(--mono)", color: "var(--muted)", textTransform: "uppercase" }}>Max Output Tokens</span>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", fontFamily: "var(--mono)" }}>{model.maxOutput}</span>
              </div>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <span style={{ display: "block", fontSize: "10px", fontFamily: "var(--mono)", color: "var(--muted)", textTransform: "uppercase" }}>Cost / 1K Input Tokens</span>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", fontFamily: "var(--mono)" }}>{model.cost1kInput}</span>
              </div>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <span style={{ display: "block", fontSize: "10px", fontFamily: "var(--mono)", color: "var(--muted)", textTransform: "uppercase" }}>Cost / 1K Output Tokens</span>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", fontFamily: "var(--mono)" }}>{model.cost1kOutput}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px", marginBottom: "40px" }}>
            <h3 style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.08em" }}>
              Best Suited For
            </h3>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-dim)" }}>
              {model.bestFor}
            </p>
          </div>

          {/* Call to Actions */}
          <div style={{ display: "flex", gap: "16px", borderTop: "1px solid var(--border)", paddingTop: "32px" }}>
            <Link href="/signup" className="btn-primary" style={{ flex: 1, justifyContent: "center", textAlign: "center" }}>
              Chat with {model.name} <span className="btn-arrow">→</span>
            </Link>
            <Link href="/models" className="btn-secondary" style={{ flex: 1, justifyContent: "center", textAlign: "center" }}>
              Compare other models
            </Link>
          </div>
        </div>
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
