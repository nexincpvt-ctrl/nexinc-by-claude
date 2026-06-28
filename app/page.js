"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./landing.css";

export default function LandingPage() {
  const proceduralCanvasRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const bgVideoRef = useRef(null);
  const statsSectionRef = useRef(null);

  // States for counters
  const [counts, setCounts] = useState([0, 0, 0, 0]);

  useEffect(() => {
    // 1. Procedural Background Animation
    const pvc = proceduralCanvasRef.current;
    if (!pvc) return;
    const pc = pvc.getContext("2d");
    let PW = (pvc.width = window.innerWidth);
    let PH = (pvc.height = window.innerHeight);

    const handleResize = () => {
      if (pvc) {
        PW = pvc.width = window.innerWidth;
        PH = pvc.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    const T = "94,224,168"; // Soft mint green color code
    let t = 0;

    // Data streams (binary rain)
    const COLS = 60;
    const streams = Array.from({ length: COLS }, (_, i) => ({
      x: (i / COLS) * window.innerWidth + Math.random() * 20 - 10,
      y: Math.random() * window.innerHeight,
      speed: 0.4 + Math.random() * 1.2,
      len: 60 + Math.random() * 120,
      alpha: 0.04 + Math.random() * 0.12,
      chars: Array.from({ length: 20 }, () =>
        String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96))
      ),
    }));

    // Tunnel Rings
    const RINGS = 18;

    // Glowing Orbs
    const orbs = Array.from({ length: 22 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.5 + Math.random() * 3,
      speed: 0.00015 + Math.random() * 0.0003,
      phase: Math.random() * Math.PI * 2,
      amp: 0.04 + Math.random() * 0.08,
      baseY: Math.random(),
      alpha: 0.2 + Math.random() * 0.5,
    }));

    let scanY = 0;
    let animFrameId;

    const drawProc = () => {
      t += 0.008;
      const W = PW;
      const H = PH;

      pc.fillStyle = "rgba(10,15,13,0.18)";
      pc.fillRect(0, 0, W, H);

      // ── 1. Tunnel / wormhole rings ──
      const cx = W * 0.5;
      const cy = H * 0.5;
      for (let i = 0; i < RINGS; i++) {
        const phase = (i / RINGS + t * 0.15) % 1;
        const scale = Math.pow(phase, 1.6);
        const rx = scale * W * 0.72;
        const ry = scale * H * 0.45;
        const alpha = (1 - phase) * 0.09;
        pc.beginPath();
        pc.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        pc.strokeStyle = `rgba(${T},${alpha})`;
        pc.lineWidth = 0.5 + (1 - phase) * 1.5;
        pc.stroke();
      }

      // ── 2. Diagonal data-stream lines (depth perspective) ──
      const vLines = 12;
      for (let i = 0; i < vLines; i++) {
        const ang = (i / vLines) * Math.PI * 2 + t * 0.04;
        const x0 = cx + Math.cos(ang) * W * 0.02;
        const y0 = cy + Math.sin(ang) * H * 0.02;
        const x1 = cx + Math.cos(ang) * W * 0.75;
        const y1 = cy + Math.sin(ang) * H * 0.55;
        const grad = pc.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, `rgba(${T},0.0)`);
        grad.addColorStop(0.3 + 0.2 * Math.sin(t + i), `rgba(${T},0.07)`);
        grad.addColorStop(1, `rgba(${T},0.0)`);
        pc.beginPath();
        pc.moveTo(x0, y0);
        pc.lineTo(x1, y1);
        pc.strokeStyle = grad;
        pc.lineWidth = 0.6;
        pc.stroke();
      }

      // ── 3. Falling katakana / binary data rain ──
      pc.font = '11px "Space Mono", monospace';
      streams.forEach((s) => {
        s.y += s.speed;
        if (s.y > H + s.len) {
          s.y = -s.len;
          s.x = Math.random() * W;
        }
        if (Math.random() < 0.03) {
          const idx = Math.floor(Math.random() * s.chars.length);
          s.chars[idx] = String.fromCharCode(
            0x30a0 + Math.floor(Math.random() * 96)
          );
        }
        const charH = 14;
        for (let k = 0; k < s.chars.length; k++) {
          const cy2 = s.y - k * charH;
          if (cy2 < -charH || cy2 > H + charH) continue;
          const fade = k === 0 ? 1 : 1 - k / s.chars.length;
          const bright = k === 0 ? "240,244,242" : "138,145,156";
          pc.fillStyle = `rgba(${bright},${s.alpha * fade * 0.75})`;
          pc.fillText(s.chars[k], s.x, cy2);
        }
      });

      // ── 4. Floating glowing orbs ──
      orbs.forEach((o) => {
        const ox = o.x * W;
        const oy =
          (o.baseY + Math.sin(t * o.speed * 400 + o.phase) * o.amp) * H;
        const pulse = 0.7 + 0.3 * Math.sin(t * 2 + o.phase);
        const grd = pc.createRadialGradient(
          ox,
          oy,
          0,
          ox,
          oy,
          o.r * 8 * pulse
        );
        grd.addColorStop(0, `rgba(${T},${o.alpha * pulse})`);
        grd.addColorStop(0.4, `rgba(${T},${o.alpha * 0.3 * pulse})`);
        grd.addColorStop(1, "rgba(46,232,165,0)");
        pc.beginPath();
        pc.arc(ox, oy, o.r * 8 * pulse, 0, Math.PI * 2);
        pc.fillStyle = grd;
        pc.fill();

        // solid core
        pc.beginPath();
        pc.arc(ox, oy, o.r * pulse, 0, Math.PI * 2);
        pc.fillStyle = `rgba(${T},${o.alpha})`;
        pc.fill();
      });

      // ── 5. Horizontal scan sweep ──
      scanY = (scanY + 0.5) % H;
      const scanGrad = pc.createLinearGradient(0, scanY - 60, 0, scanY + 60);
      scanGrad.addColorStop(0, "rgba(46,232,165,0)");
      scanGrad.addColorStop(0.5, "rgba(46,232,165,0.025)");
      scanGrad.addColorStop(1, "rgba(46,232,165,0)");
      pc.fillStyle = scanGrad;
      pc.fillRect(0, scanY - 60, W, 120);

      // Vignette glow
      const vg = pc.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        Math.min(W, H) * 0.35
      );
      vg.addColorStop(0, `rgba(${T},0.04)`);
      vg.addColorStop(1, "rgba(46,232,165,0)");
      pc.fillStyle = vg;
      pc.fillRect(0, 0, W, H);

      animFrameId = requestAnimationFrame(drawProc);
    };

    drawProc();

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  useEffect(() => {
    // 2. Interactive Mouse-Glow Particle Canvas
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W2 = (canvas.width = window.innerWidth);
    let H2 = (canvas.height = window.innerHeight);

    let particles = [];
    const T = "94,224,168";

    const initParticles = () => {
      particles = [];
      const N = Math.floor((W2 * H2) / 22000);
      for (let i = 0; i < N; i++) {
        particles.push({
          x: Math.random() * W2,
          y: Math.random() * H2,
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
        W2 = canvas.width = window.innerWidth;
        H2 = canvas.height = window.innerHeight;
        initParticles();
      }
    };
    window.addEventListener("resize", handleResize);

    let mx = W2 / 2;
    let my = H2 / 2;
    const handleMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    document.addEventListener("mousemove", handleMouseMove);

    let animId;

    const drawParticles = () => {
      ctx.clearRect(0, 0, W2, H2);

      // Mouse glow
      const gr = ctx.createRadialGradient(mx, my, 0, mx, my, 280);
      gr.addColorStop(0, `rgba(${T},0.06)`);
      gr.addColorStop(1, "transparent");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W2, H2);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W2;
        if (p.x > W2) p.x = 0;
        if (p.y < 0) p.y = H2;
        if (p.y > H2) p.y = 0;

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

  useEffect(() => {
    // 3. Scroll Reveal and Count Animations
    const reveals = document.querySelectorAll(".reveal, .stat-item");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => revealObserver.observe(el));

    // Stats counter trigger
    const statsEl = statsSectionRef.current;
    if (statsEl) {
      const statsObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animateCounters();
            statsObserver.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      statsObserver.observe(statsEl);
    }

    const animateCounters = () => {
      const targets = [47, 99.98, 2.1, 38];
      const duration = 1800;
      const start = performance.now();

      const update = (now) => {
        const timeFraction = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - timeFraction, 3); // easeOutCubic

        const currentVals = targets.map((target) => {
          const val = target * ease;
          const isFloat = String(target).includes(".");
          return isFloat ? parseFloat(val.toFixed(2)) : Math.floor(val);
        });

        setCounts(currentVals);

        if (timeFraction < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    };

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  // Card spotlight hover handler
  const handleCardMouseMove = (e, cardRef) => {
    if (!cardRef) return;
    const rect = cardRef.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(46,232,165,0.06) 0%, var(--card2) 60%)`;
  };

  const handleCardMouseLeave = (cardRef) => {
    if (!cardRef) return;
    cardRef.style.background = "";
  };

  // Helper refs for card spotlight
  const cardsRef = useRef([]);

  return (
    <div className="landing-body">
      {/* ── Video background ── */}
      <div id="video-bg">
        <video
          ref={bgVideoRef}
          id="bg-video"
          autoPlay
          muted
          loop
          playsInline
          onCanPlayThrough={() => bgVideoRef.current?.classList.add("loaded")}
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-typing-on-a-computer-1584/1080p.mp4"
            type="video/mp4"
          />
        </video>
        <canvas ref={proceduralCanvasRef} id="procedural-video"></canvas>
        <div id="video-overlay"></div>
      </div>

      {/* Particle canvas on top */}
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
            <a href="#models">Models</a>
          </li>
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#terminal">Terminal</a>
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

      {/* Hero */}
      <section className="hero">
        <div className="cube-scene">
          <div className="cube-wrap">
            <div className="cube-face face-f"></div>
            <div className="cube-face face-b"></div>
            <div className="cube-face face-l"></div>
            <div className="cube-face face-r"></div>
            <div className="cube-face face-t"></div>
            <div className="cube-face face-bo"></div>
          </div>
        </div>

        <div className="hero-eyebrow">MODEL MESH · LIVE · 2026</div>

        <h1 className="hero-title">
          <span className="line1">Every model.</span>
          <span className="line2">One terminal</span>
        </h1>

        <p className="hero-sub">
          Spin up a workspace and start running GPT-5.5, Gemini, Claude, Llama
          and 40+ models — all from a single unified interface.
        </p>

        <div className="hero-actions">
          <Link href="/signup" className="btn-primary">
            Get started free <span className="btn-arrow">→</span>
          </Link>
          <Link href="/models" className="btn-secondary">
            Browse models
          </Link>
        </div>

        <div className="scroll-hint">
          <div className="scroll-line"></div>
          Scroll
        </div>
      </section>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-track" id="ticker">
          <div className="ticker-item">
            GPT-5.5 (OpenAI) <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Gemini 2.5 Pro <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Claude Opus 4 <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Llama 3.3 70B <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Mistral Large <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            DeepSeek R2 <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Qwen 2.5 Max <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Grok 3 <span className="sep">◆</span>
          </div>
          {/* duplicate for infinite carousel loop */}
          <div className="ticker-item">
            GPT-5.5 (OpenAI) <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Gemini 2.5 Pro <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Claude Opus 4 <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Llama 3.3 70B <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Mistral Large <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            DeepSeek R2 <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Qwen 2.5 Max <span className="sep">◆</span>
          </div>
          <div className="ticker-item">
            Grok 3 <span className="sep">◆</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div ref={statsSectionRef} className="stats-bar" id="stats">
        <div className="stat-item">
          <div className="stat-num">{counts[0]}</div>
          <div className="stat-label">AI Models live</div>
        </div>
        <div className="stat-item" style={{ transitionDelay: "0.1s" }}>
          <div className="stat-num">{counts[1]}%</div>
          <div className="stat-label">Uptime SLA</div>
        </div>
        <div className="stat-item" style={{ transitionDelay: "0.2s" }}>
          <div className="stat-num">{counts[2]}M</div>
          <div className="stat-label">Requests today</div>
        </div>
        <div className="stat-item" style={{ transitionDelay: "0.3s" }}>
          <div className="stat-num">~{counts[3]}ms</div>
          <div className="stat-label">Median latency</div>
        </div>
      </div>

      {/* Models section */}
      <section className="section-pad models-section" id="models">
        <div className="reveal">
          <div className="section-label">// available models</div>
          <h2 className="section-title">
            Every frontier model,
            <br />
            one API key.
          </h2>
          <p className="section-sub">
            Switch between providers mid-conversation. No separate accounts, no
            separate billing.
          </p>
        </div>

        <div className="models-grid reveal">
          {[
            {
              key: "gpt-5.5",
              provider: "OpenAI",
              name: "GPT-5.5",
              desc: "The latest flagship from OpenAI. Exceptional reasoning, coding, and multimodal understanding.",
              tags: ["Vision", "Code", "128K ctx"],
            },
            {
              key: "gemini-2.5-pro",
              provider: "Google DeepMind",
              name: "Gemini 2.5 Pro",
              desc: "Google's most capable model. Best-in-class for long-context analysis and complex reasoning.",
              tags: ["2M ctx", "Multimodal", "Grounding"],
            },
            {
              key: "claude-3.5-sonnet",
              provider: "Anthropic",
              name: "Claude 3.5 Sonnet",
              desc: "Thoughtful, nuanced, and safety-focused. Unmatched for complex analysis and writing.",
              tags: ["Research", "Writing", "200K ctx"],
            },
            {
              key: "llama-3.3-70b-reasoning",
              provider: "Meta AI",
              name: "Llama 3.3 70B",
              desc: "Open-source powerhouse. Self-hostable, fast, and surprisingly capable for its size.",
              tags: ["Open source", "Fast", "Fine-tune"],
            },
            {
              key: "custom-cloud-gpu",
              provider: "xAI",
              name: "Grok 3",
              desc: "Real-time web access baked in. Ideal for current events, research, and live data tasks.",
              tags: ["Web access", "Real-time", "STEM"],
            },
            {
              key: "deepseek-r1",
              provider: "DeepSeek",
              name: "DeepSeek R1",
              desc: "Chain-of-thought reasoning model with near-frontier performance at a fraction of the cost.",
              tags: ["Reasoning", "Math", "Low cost"],
            },
          ].map((m, idx) => (
            <Link
              href={`/models/${m.key}`}
              key={m.key}
              ref={(el) => (cardsRef.current[idx] = el)}
              className="model-card"
              onMouseMove={(e) => handleCardMouseMove(e, cardsRef.current[idx])}
              onMouseLeave={() => handleCardMouseLeave(cardsRef.current[idx])}
              style={{ textDecoration: "none" }}
            >
              <div className="model-provider">{m.provider}</div>
              <div className="model-name">{m.name}</div>
              <div className="model-desc">{m.desc}</div>
              <div className="model-tags">
                {m.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features section */}
      <section className="section-pad" id="features">
        <div className="reveal">
          <div className="section-label">// core features</div>
          <h2 className="section-title">
            Built for developers
            <br />
            who move fast.
          </h2>
        </div>

        <div className="features-grid reveal">
          {[
            {
              title: "Unified API",
              desc: "One endpoint, every model. Switch providers with a single parameter change — no SDK migration required.",
              svg: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              ),
            },
            {
              title: "CodeInc Editor",
              desc: "Write, run, and inspect code directly in the chat. Full LSP support, console output, and diff view.",
              svg: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              ),
            },
            {
              title: "Private mode",
              desc: "End-to-end encrypted sessions with zero data retention. Your conversations never leave your control.",
              svg: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              ),
            },
            {
              title: "Research mode",
              desc: "Live web access with inline citations. Every claim is sourced and traceable back to the original document.",
              svg: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              ),
            },
          ].map((f, idx) => (
            <div
              key={f.title}
              ref={(el) => (cardsRef.current[idx + 6] = el)}
              className="feature-card"
              onMouseMove={(e) =>
                handleCardMouseMove(e, cardsRef.current[idx + 6])
              }
              onMouseLeave={() => handleCardMouseLeave(cardsRef.current[idx + 6])}
            >
              <div className="feature-icon">{f.svg}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Terminal section */}
      <section className="section-pad terminal-section" id="terminal">
        <div className="terminal-layout">
          <div className="reveal">
            <div className="section-label">// how it works</div>
            <h2 className="section-title">
              Start in
              <br />
              30 seconds.
            </h2>
            <p className="section-sub" style={{ marginBottom: "36px" }}>
              No config files, no environment headaches. Pick a model and start
              chatting — or drop to our API for full programmatic control.
            </p>
            <Link href="/signup" className="btn-primary">
              Open terminal <span className="btn-arrow">→</span>
            </Link>
          </div>

          <div className="terminal-window reveal reveal-delay-2">
            <div className="terminal-bar">
              <div className="t-dot r"></div>
              <div className="t-dot y"></div>
              <div className="t-dot g"></div>
              <div className="terminal-title">NEXINC / RUNTIME — US-EAST-1A</div>
            </div>
            <div className="terminal-body">
              <div>
                <span className="t-prompt">$ </span>
                <span className="t-cmd">nexinc auth login</span>
              </div>
              <div className="t-out">✓ Authenticated as lakshay@domain.com</div>
              <div className="t-out">✓ Workspace: nexinc-prod</div>
              <br />
              <div>
                <span className="t-prompt">$ </span>
                <span className="t-cmd">nexinc run --model gpt-5.5</span>
              </div>
              <div className="t-out">
                Spinning up runtime...{" "}
                <span style={{ color: "var(--teal)" }}>done</span>
              </div>
              <div className="t-out">
                Model mesh: <span className="t-key">GPT-5.5</span> →{" "}
                <span className="t-val">US-EAST-1A</span>
              </div>
              <br />
              <div>
                <span className="t-prompt">❯ </span>
                <span className="t-cmd">What is quantum entanglement?</span>
              </div>
              <br />
              <div className="t-out" style={{ color: "var(--text)", lineHeight: "1.7" }}>
                Quantum entanglement is a phenomenon where
                <br />
                two particles become correlated in such a way
                <br />
                that the state of one <span className="t-key">instantly</span>{" "}
                influences
                <br />
                the other, regardless of distance...
              </div>
              <br />
              <div>
                <span className="t-prompt">❯ </span>
                <span className="t-cursor"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section" id="pricing">
        <div className="cta-glow"></div>
        <div className="reveal">
          <div
            className="section-label"
            style={{ textAlign: "center", marginBottom: "24px" }}
          >
            // get started
          </div>
          <h2 className="cta-title">
            Build something
            <br />
            <em>impossible.</em>
          </h2>
          <p className="cta-sub">
            Free to start. No credit card required. Upgrade when you need more.
          </p>
          <div className="cta-buttons">
            <Link
              href="/signup"
              className="btn-primary"
              style={{ fontSize: "13px", padding: "18px 48px" }}
            >
              Create free account <span className="btn-arrow">→</span>
            </Link>
            <Link
              href="/pricing"
              className="btn-secondary"
              style={{ fontSize: "13px", padding: "18px 48px" }}
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-copy">© 2026 NEXINC. ALL RIGHTS RESERVED.</div>
        <div className="footer-copy" style={{ display: "flex", gap: "32px" }}>
          <a
            href="#"
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "0.08em",
            }}
          >
            DOCS
          </a>
          <a
            href="#"
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "0.08em",
            }}
          >
            STATUS
          </a>
          <a
            href="#"
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "0.08em",
            }}
          >
            PRIVACY
          </a>
        </div>
        <div className="footer-status">
          <div className="status-dot"></div>
          RUNTIME NOMINAL · NODE GEMINI-2.5-PRO
        </div>
      </footer>
    </div>
  );
}
