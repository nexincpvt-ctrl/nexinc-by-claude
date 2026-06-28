"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/supabase/queries";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../landing.css";

export default function PricingPage() {
  const supabase = createClient();
  const router = useRouter();
  const particleCanvasRef = useRef(null);

  // Profile and Loading States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Billing Cycle Toggle: 'monthly' or 'yearly'
  const [billingCycle, setBillingCycle] = useState("monthly");

  // Promo & Referral States
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [devKeyInput, setDevKeyInput] = useState("");
  const [modalDevKey, setModalDevKey] = useState("");
  const [showModalDevInput, setShowModalDevInput] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Accordion FAQ states
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const prof = await getProfile(supabase, user.id);
          setProfile(prof);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    // Interactive mouse glow particles
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    let particles = [];
    const T = "94,224,168"; // Soft mint green

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

  const handleUpgrade = async () => {
    if (!profile) {
      router.push(`/login?redirect=/pricing`);
      return;
    }
    setCheckingOut(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate Stripe Checkout.");
      }
    } catch (err) {
      console.error("Stripe Checkout Error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManagePortal = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to open Billing Portal.");
      }
    } catch (err) {
      console.error("Billing Portal Error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleRedeemCode = async (codeToUse) => {
    const code = (codeToUse || promoCode).trim().toUpperCase();
    if (!code) {
      setPromoMessage("Please enter a valid code.");
      setPromoSuccess(false);
      return;
    }

    const validCodes = ["ULTIMATE", "DEVELOPER", "WELCOME2026", "NEXINC"];
    if (validCodes.includes(code)) {
      try {
        setCheckingOut(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?redirect=/pricing");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .update({
            plan: "ultimate",
            billing_cycle: billingCycle,
            plan_renews_at: new Date(
              Date.now() +
                (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw error;

        setProfile(data);
        setPromoSuccess(true);
        setPromoMessage(
          `🎉 Code '${code}' redeemed successfully! Ultimate plan unlocked.`
        );
        setPromoCode("");
        setIsModalOpen(false);
      } catch (err) {
        console.error("Redeem code error:", err);
        setPromoMessage("Failed to redeem code. Please try again.");
        setPromoSuccess(false);
      } finally {
        setCheckingOut(false);
      }
    } else {
      setPromoMessage("Invalid code. Try using 'ULTIMATE' or 'DEVELOPER'.");
      setPromoSuccess(false);
    }
  };

  const handleReferralUpgrade = async (type, keyInput) => {
    try {
      setCheckingOut(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/pricing");
        return;
      }

      if (type === "developer") {
        const key = (keyInput || "").trim().toUpperCase();
        if (!key) {
          setPromoSuccess(false);
          setPromoMessage("❌ Developer Key is required.");
          setCheckingOut(false);
          return;
        }

        const validDevKeys = ["NEXINC_DEV", "DEVKEY", "NEXINC_DEV_2026"];
        let isValid = validDevKeys.includes(key);

        if (!isValid) {
          const { data: matchedProfile, error: matchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("referral_code", key)
            .maybeSingle();

          if (matchedProfile && !matchError) {
            isValid = true;
          }
        }

        if (!isValid) {
          setPromoSuccess(false);
          setPromoMessage("❌ Invalid Developer Referral Key. Access Denied.");
          setCheckingOut(false);
          return;
        }
      }

      const days = type === "developer" ? 365 : 90;
      const cycle = type === "developer" ? "yearly" : "monthly";
      const label =
        type === "developer"
          ? "Developer Referral (1 Year free)"
          : "Beta Tester Referral (3 Months free)";

      const { data, error } = await supabase
        .from("profiles")
        .update({
          plan: "ultimate",
          billing_cycle: cycle,
          plan_renews_at: new Date(
            Date.now() + days * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setPromoSuccess(true);
      setPromoMessage(
        `✨ Referral claimed! Ultimate plan activated via ${label}.`
      );
      setIsModalOpen(false);
      setDevKeyInput("");
      setModalDevKey("");
      setShowModalDevInput(false);
    } catch (err) {
      console.error("Referral error:", err);
      setPromoMessage(`Failed to apply ${type} referral.`);
      setPromoSuccess(false);
    } finally {
      setCheckingOut(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Card Spotlight Mouse Hover
  const cardRefs = useRef({});
  const handleMouseMove = (e, key) => {
    const card = cardRefs.current[key];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(94,224,168,0.06) 0%, var(--card2) 60%)`;
  };

  const handleMouseLeave = (key) => {
    const card = cardRefs.current[key];
    if (!card) return;
    card.style.background = "";
  };

  const monthlyPrice = 15;
  const yearlyPrice = 12; // 20% discount

  const devMonthlyPrice = 49;
  const devYearlyPrice = 39; // 20% discount

  const faqs = [
    {
      q: "Can I cancel my subscription at any time?",
      a: "Absolutely! You can upgrade, downgrade, or cancel your subscription at any time directly through the Stripe billing portal. If you cancel, your Ultimate privileges will remain active until the end of your current billing cycle.",
    },
    {
      q: "What benefits are unlocked in the Ultimate tier?",
      a: "You get access to premium models like Gemini 2.5 Pro, support for Ollama local models, and custom cloud GPU deployments. Ultimate users also benefit from higher processing limits, priority support, and early access to experimental features.",
    },
    {
      q: "What happens to my chats if I downgrade back to Free?",
      a: "Nothing! Your conversations and upload histories are stored securely and will not be deleted. If you downgrade, your premium model options will simply show as locked again, and you can continue using the Free models without losing any of your data.",
    },
    {
      q: "Are there daily query limits on the Free plan?",
      a: "No! The Free plan offers unlimited messages on all free models (including NVIDIA-supported ones and Groq/OpenRouter). We believe powerful AI minds should be accessible to everyone.",
    },
  ];

  return (
    <div className="landing-body" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Background Elements */}
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
            <Link href="/models">Models</Link>
          </li>
          <li>
            <Link href="/#features">Features</Link>
          </li>
          <li>
            <Link href="/#terminal">Terminal</Link>
          </li>
          <li>
            <Link href="/pricing" style={{ color: "var(--teal)" }}>Pricing</Link>
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

      {/* Pricing Header */}
      <section className="section-pad" style={{ paddingBottom: "20px", paddingTop: "140px", zIndex: 10 }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div className="section-label">// membership pricing</div>
          <h1 className="section-title" style={{ fontSize: "clamp(36px, 5vw, 68px)", marginBottom: "20px" }}>
            Unleash the full core
          </h1>
          <p className="section-sub" style={{ margin: "0 auto 40px", maxWidth: "600px" }}>
            Switch between plans anytime. Explore premium reasoning minds, spin up custom remote GPUs, and unlock maximum context depth.
          </p>

          {/* Monthly / Yearly Switcher */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", margin: "0 auto 40px" }}>
            <span style={{ fontSize: "12px", fontFamily: "var(--mono)", color: billingCycle === "monthly" ? "var(--text)" : "var(--muted)" }}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              style={{
                width: "48px",
                height: "24px",
                borderRadius: "12px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                position: "relative",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "var(--teal)",
                  transform: billingCycle === "yearly" ? "translateX(24px)" : "translateX(0)",
                  transition: "transform 0.2s ease"
                }}
              ></div>
            </button>
            <span style={{ fontSize: "12px", fontFamily: "var(--mono)", color: billingCycle === "yearly" ? "var(--text)" : "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              Yearly <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(94,224,168,0.1)", border: "1px solid var(--teal)", color: "var(--teal)" }}>Save 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main style={{ flex: 1, zIndex: 10, maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "0 24px 60px" }}>
        
        {/* Status Notification */}
        {promoMessage && (
          <div
            style={{
              maxWidth: "500px",
              margin: "0 auto 32px",
              padding: "16px 20px",
              border: `1px solid ${promoSuccess ? "var(--teal)" : "#FF6B5C"}`,
              background: promoSuccess ? "rgba(94,224,168,0.05)" : "rgba(255,107,92,0.05)",
              color: promoSuccess ? "var(--teal)" : "#FF6B5C",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            {promoMessage}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "80px",
          }}
        >
          {/* Card 1: Free Tier */}
          <div
            ref={(el) => (cardRefs.current["free"] = el)}
            onMouseMove={(e) => handleMouseMove(e, "free")}
            onMouseLeave={() => handleMouseLeave("free")}
            className="model-card"
            style={{
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "440px",
              padding: "40px 32px"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Standard</span>
                <span style={{ fontSize: "9px", fontFamily: "var(--mono)", textTransform: "uppercase", padding: "2px 8px", background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>Free</span>
              </div>
              <h3 className="model-name" style={{ fontSize: "24px", color: "var(--text)" }}>Free Plan</h3>
              <p className="model-desc" style={{ fontSize: "12.5px" }}>Access standard intelligence and basic chat options.</p>
              
              <div style={{ margin: "24px 0", display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: "42px", fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>$0</span>
                <span style={{ fontSize: "12px", fontFamily: "var(--mono)", color: "var(--muted)", marginLeft: "4px" }}>/ forever</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  "Unlimited text queries",
                  "Free AI Models (Llama, Qwen, Mistral)",
                  "Basic Image Generation",
                  "Standard Response Speeds",
                ].map((perk) => (
                  <li key={perk} style={{ fontSize: "12.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--teal)" }}>✔</span> {perk}
                  </li>
                ))}
              </ul>
            </div>

            <button
              disabled
              style={{
                width: "100%",
                padding: "14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                textTransform: "uppercase",
                cursor: "not-allowed",
                textAlign: "center"
              }}
            >
              Current Plan
            </button>
          </div>

          {/* Card 2: Ultimate Tier */}
          <div
            ref={(el) => (cardRefs.current["ultimate"] = el)}
            onMouseMove={(e) => handleMouseMove(e, "ultimate")}
            onMouseLeave={() => handleMouseLeave("ultimate")}
            className="model-card"
            style={{
              border: "2px solid var(--teal)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "440px",
              padding: "40px 32px",
              boxShadow: "0 0 30px rgba(94,224,168,0.05)"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--teal)", textTransform: "uppercase" }}>Ultimate</span>
                <span style={{ fontSize: "9px", fontFamily: "var(--mono)", textTransform: "uppercase", padding: "2px 8px", background: "rgba(94,224,168,0.1)", border: "1px solid var(--teal)", color: "var(--teal)" }}>Popular</span>
              </div>
              <h3 className="model-name" style={{ fontSize: "24px", color: "var(--text)" }}>Ultimate Plan</h3>
              <p className="model-desc" style={{ fontSize: "12.5px" }}>Unlock state-of-the-art multimodal vision, local models, and speed.</p>
              
              <div style={{ margin: "24px 0", display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: "42px", fontWeight: 700, fontFamily: "var(--mono)", color: "var(--teal)" }}>
                  ${billingCycle === "monthly" ? monthlyPrice : yearlyPrice}
                </span>
                <span style={{ fontSize: "12px", fontFamily: "var(--mono)", color: "var(--muted)", marginLeft: "4px" }}>/ month</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  "Everything in Free Plan",
                  "Vision support (image uploads)",
                  "Premium models (Gemini, Claude, GPT)",
                  "Ollama Local Model integration",
                  "Priority bandwidth & speeds"
                ].map((perk) => (
                  <li key={perk} style={{ fontSize: "12.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--teal)" }}>✔</span> {perk}
                  </li>
                ))}
              </ul>
            </div>

            {loading ? (
              <button
                disabled
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  cursor: "not-allowed",
                  textAlign: "center"
                }}
              >
                Connecting...
              </button>
            ) : profile && profile.plan === "ultimate" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(94,224,168,0.1)",
                    border: "1px solid var(--teal)",
                    color: "var(--teal)",
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    cursor: "not-allowed",
                    textAlign: "center"
                  }}
                >
                  Active on Ultimate ✨
                </button>
                <button
                  onClick={handleManagePortal}
                  disabled={loadingPortal}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontFamily: "var(--mono)",
                    fontSize: "9px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  {loadingPortal ? "Redirecting..." : "Manage Billing Portal"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={checkingOut}
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "11px",
                  padding: "14px",
                  textAlign: "center"
                }}
              >
                {checkingOut ? "Redirecting..." : "Upgrade to Ultimate"}
              </button>
            )}
          </div>

          {/* Card 3: Developer Tier (Added as requested!) */}
          <div
            ref={(el) => (cardRefs.current["developer"] = el)}
            onMouseMove={(e) => handleMouseMove(e, "developer")}
            onMouseLeave={() => handleMouseLeave("developer")}
            className="model-card"
            style={{
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "440px",
              padding: "40px 32px"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Developer</span>
                <span style={{ fontSize: "9px", fontFamily: "var(--mono)", textTransform: "uppercase", padding: "2px 8px", background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>Power</span>
              </div>
              <h3 className="model-name" style={{ fontSize: "24px", color: "var(--text)" }}>Developer Plan</h3>
              <p className="model-desc" style={{ fontSize: "12.5px" }}>For power creators. Extended GPU runtimes, high quotas, and API.</p>
              
              <div style={{ margin: "24px 0", display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: "42px", fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>
                  ${billingCycle === "monthly" ? devMonthlyPrice : devYearlyPrice}
                </span>
                <span style={{ fontSize: "12px", fontFamily: "var(--mono)", color: "var(--muted)", marginLeft: "4px" }}>/ month</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  "Everything in Ultimate Plan",
                  "Dedicated GPU Cluster runtimes",
                  "Extended context API endpoints",
                  "Shared collaborative workspaces",
                  "Early beta reasoning model access"
                ].map((perk) => (
                  <li key={perk} style={{ fontSize: "12.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--teal)" }}>✔</span> {perk}
                  </li>
                ))}
              </ul>
            </div>

            {loading ? (
              <button
                disabled
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  cursor: "not-allowed",
                  textAlign: "center"
                }}
              >
                Connecting...
              </button>
            ) : profile && profile.plan === "ultimate" ? (
              <button
                disabled
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  cursor: "not-allowed",
                  textAlign: "center"
                }}
              >
                Included in Ultimate
              </button>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={checkingOut}
                className="btn-secondary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "11px",
                  padding: "14px",
                  textAlign: "center"
                }}
              >
                {checkingOut ? "Redirecting..." : "Upgrade to Developer"}
              </button>
            )}
          </div>

        </div>

        {/* Demo Upgrade Pathways */}
        <div style={{ marginBottom: "80px" }}>
          <h3 style={{ fontFamily: "var(--sans)", fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "32px", color: "var(--text)" }}>
            Demo Upgrade Pathways
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Developer Referral Card */}
            <div
              ref={(el) => (cardRefs.current["dev-ref"] = el)}
              onMouseMove={(e) => handleMouseMove(e, "dev-ref")}
              onMouseLeave={() => handleMouseLeave("dev-ref")}
              className="feature-card"
              style={{
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "center",
                padding: "32px 24px"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "16px" }}>💼</div>
                <h4 style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", marginBottom: "8px", letterSpacing: "0.08em" }}>
                  Developer Referral
                </h4>
                <p style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: "1.6", marginBottom: "20px" }}>
                  For creators. Enter your developer key below to claim <strong>1 year</strong> of Ultimate access.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                <input
                  type="password"
                  value={devKeyInput}
                  onChange={(e) => setDevKeyInput(e.target.value)}
                  placeholder="Dev Key"
                  style={{
                    flex: 1,
                    padding: "8px 14px",
                    background: "var(--dark)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontSize: "11.5px",
                    fontFamily: "var(--mono)",
                    outline: "none"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleReferralUpgrade("developer", devKeyInput);
                  }}
                />
                <button
                  onClick={() => handleReferralUpgrade("developer", devKeyInput)}
                  style={{
                    padding: "8px 16px",
                    background: "var(--teal)",
                    color: "var(--dark)",
                    border: "none",
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    cursor: "pointer"
                  }}
                >
                  Claim
                </button>
              </div>
            </div>

            {/* Redeem Code Card */}
            <div
              ref={(el) => (cardRefs.current["promo"] = el)}
              onMouseMove={(e) => handleMouseMove(e, "promo")}
              onMouseLeave={() => handleMouseLeave("promo")}
              className="feature-card"
              style={{
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "center",
                padding: "32px 24px"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "16px" }}>🔑</div>
                <h4 style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", marginBottom: "8px", letterSpacing: "0.08em" }}>
                  Redeem Promo Code
                </h4>
                <p style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: "1.6", marginBottom: "20px" }}>
                  Have an access code? Enter it below (use code <code style={{ color: "var(--teal)", background: "rgba(94,224,168,0.1)", padding: "1px 4px", borderRadius: "2px" }}>ULTIMATE</code>).
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Code"
                  style={{
                    flex: 1,
                    padding: "8px 14px",
                    background: "var(--dark)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontSize: "11.5px",
                    fontFamily: "var(--mono)",
                    outline: "none"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRedeemCode();
                  }}
                />
                <button
                  onClick={() => handleRedeemCode()}
                  style={{
                    padding: "8px 16px",
                    background: "var(--teal)",
                    color: "var(--dark)",
                    border: "none",
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    cursor: "pointer"
                  }}
                >
                  Redeem
                </button>
              </div>
            </div>

            {/* Tester Referral Card */}
            <div
              ref={(el) => (cardRefs.current["tester-ref"] = el)}
              onMouseMove={(e) => handleMouseMove(e, "tester-ref")}
              onMouseLeave={() => handleMouseLeave("tester-ref")}
              className="feature-card"
              style={{
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "center",
                padding: "32px 24px"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "16px" }}>🧪</div>
                <h4 style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text)", marginBottom: "8px", letterSpacing: "0.08em" }}>
                  Tester Referral
                </h4>
                <p style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: "1.6", marginBottom: "20px" }}>
                  For early beta testers and partners. Instantly activates the Ultimate plan for <strong>3 months</strong> free.
                </p>
              </div>
              <button
                onClick={() => handleReferralUpgrade("tester")}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--teal)",
                  color: "var(--dark)",
                  border: "none",
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer"
                }}
              >
                Claim Tester (3Mo)
              </button>
            </div>

          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ maxWidth: "700px", margin: "0 auto 60px" }}>
          <h3 style={{ fontFamily: "var(--sans)", fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "32px", color: "var(--text)" }}>
            Frequently Asked Questions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  style={{
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    overflow: "hidden"
                  }}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "18px 24px",
                      background: "none",
                      border: "none",
                      color: "var(--text)",
                      fontFamily: "var(--mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ color: "var(--teal)", fontSize: "14px", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}>
                      ➔
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 24px 18px", fontSize: "12.5px", color: "var(--muted)", lineHeight: "1.6" }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Upgrade Options Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          {/* backdrop */}
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={() => setIsModalOpen(false)}
          />
          {/* dialog */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "420px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              padding: "32px",
              zIndex: 10
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Upgrade Options
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "16px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: "1.6", marginBottom: "24px" }}>
              NEXINC is in demo mode. Test the simulated Stripe checkout or use free pathways below to upgrade.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* stripe option */}
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  handleUpgrade();
                }}
                style={{
                  padding: "16px",
                  background: "var(--dark)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <div style={{ fontSize: "20px" }}>💳</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>Test Stripe Checkout</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>Simulated payment gateway (4242 card)</div>
                </div>
              </button>

              {/* Developer Referral inside modal */}
              <div style={{ padding: "16px", background: "var(--dark)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => setShowModalDevInput(!showModalDevInput)}
                  style={{ background: "none", border: "none", color: "var(--text)", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ fontSize: "20px" }}>💼</div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700 }}>Developer Referral (1 Year)</div>
                    <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>Claim 365 days of free power access</div>
                  </div>
                </button>
                {showModalDevInput && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px", paddingLeft: "32px" }}>
                    <input
                      type="password"
                      value={modalDevKey}
                      onChange={(e) => setModalDevKey(e.target.value)}
                      placeholder="Dev Key"
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "11px",
                        fontFamily: "var(--mono)",
                        outline: "none"
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleReferralUpgrade("developer", modalDevKey);
                      }}
                    />
                    <button
                      onClick={() => handleReferralUpgrade("developer", modalDevKey)}
                      style={{
                        padding: "6px 12px",
                        background: "var(--teal)",
                        color: "var(--dark)",
                        border: "none",
                        fontFamily: "var(--mono)",
                        fontSize: "9px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        cursor: "pointer"
                      }}
                    >
                      Submit
                    </button>
                  </div>
                )}
              </div>

              {/* Tester Referral inside modal */}
              <button
                onClick={() => handleReferralUpgrade("tester")}
                style={{
                  padding: "16px",
                  background: "var(--dark)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <div style={{ fontSize: "20px" }}>🧪</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>Beta Tester Referral (3 Months)</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>Activate Ultimate tier instantly</div>
                </div>
              </button>

              {/* simulated ULTIMATE code */}
              <button
                onClick={() => handleRedeemCode("ULTIMATE")}
                style={{
                  padding: "16px",
                  background: "var(--dark)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <div style={{ fontSize: "20px" }}>🔑</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>Redeem code 'ULTIMATE'</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>Instantly upgrade through coupon code</div>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}

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
