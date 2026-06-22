"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/supabase/queries";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PricingPage() {
  const supabase = createClient();
  const router = useRouter();

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?redirect=/pricing");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .update({
            plan: "ultimate",
            billing_cycle: billingCycle,
            plan_renews_at: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw error;

        setProfile(data);
        setPromoSuccess(true);
        setPromoMessage(`🎉 Code '${code}' redeemed successfully! Ultimate plan unlocked.`);
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
      const { data: { user } } = await supabase.auth.getUser();
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
          // Look up if the code exists in any profile's referral_code column
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
      const label = type === "developer" ? "Developer Referral (1 Year free)" : "Beta Tester Referral (3 Months free)";

      const { data, error } = await supabase
        .from("profiles")
        .update({
          plan: "ultimate",
          billing_cycle: cycle,
          plan_renews_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setPromoSuccess(true);
      setPromoMessage(`✨ Referral claimed! Ultimate plan activated via ${label}.`);
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

  const monthlyPrice = 15;
  const yearlyPrice = 12; // 20% discount

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
    <div className="min-h-screen bg-brand-bg text-brand-dark flex flex-col py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      {/* Header and Back navigation */}
      <div className="max-w-4xl w-full mx-auto mb-10 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-brand-primary hover:text-brand-primary/85 transition-colors uppercase tracking-wider font-quicksand bg-brand-card/75 dark:bg-brand-card/55 border border-brand-dark/5 dark:border-brand-dark/15 px-4 py-2.5 rounded-full shadow-sm hover:scale-[1.02] active:scale-95 duration-150 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </Link>
        <span className="text-xs font-bold text-brand-dark/45">NexInc Premium Billing</span>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col items-center">
        {/* Title */}
        <div className="text-center max-w-xl mb-12">
          <h1 className="text-4xl sm:text-5xl font-black font-quicksand tracking-tight mb-4">
            Unleash the full power of NexInc
          </h1>
          <p className="text-brand-dark/70 dark:text-brand-dark/80 font-light text-sm sm:text-base leading-relaxed">
            Switch between plans anytime. Explore premium minds, connect local intelligence, and accelerate your productivity.
          </p>
        </div>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center gap-3 mb-14 bg-brand-card/80 dark:bg-brand-card/50 border border-brand-dark/5 dark:border-brand-dark/20 p-1.5 rounded-full relative shadow-sm select-none">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-300 relative z-10 cursor-pointer ${
              billingCycle === "monthly"
                ? "text-white bg-brand-primary shadow-sm"
                : "text-brand-dark/60 hover:text-brand-dark"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-300 relative z-10 cursor-pointer ${
              billingCycle === "yearly"
                ? "text-white bg-brand-primary shadow-sm"
                : "text-brand-dark/60 hover:text-brand-dark"
            }`}
          >
            Yearly Billing
          </button>
          <span className="absolute -top-7 right-2 bg-brand-success/15 dark:bg-brand-success/25 border border-brand-success/35 text-brand-success text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider animate-bounce">
            Save 20%
          </span>
        </div>

        {/* Status Notification */}
        {promoMessage && (
          <div className={`mb-8 px-6 py-3.5 rounded-2xl border text-xs font-bold max-w-md text-center w-full animate-in fade-in duration-200 ${
            promoSuccess 
              ? "bg-brand-success/10 text-brand-success border-brand-success/20"
              : "bg-brand-error/10 text-brand-error border-brand-error/20"
          }`}>
            {promoMessage}
          </div>
        )}

        {/* Pricing Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl items-stretch mb-8">
          
          {/* Free Tier Card */}
          <div className="bg-brand-card border border-brand-dark/5 dark:border-brand-dark/15 rounded-3xl p-8 flex flex-col justify-between shadow-sm relative transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-extrabold text-brand-dark/45 uppercase tracking-wider font-quicksand">Standard</span>
                <span className="bg-brand-dark/5 dark:bg-brand-dark/10 text-brand-dark/70 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Basic</span>
              </div>
              <h3 className="text-2xl font-black font-quicksand text-brand-dark mb-2">Free Plan</h3>
              <p className="text-brand-dark/60 dark:text-brand-dark/80 text-xs font-light mb-8">Access standard intelligence and basic chat options.</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-black font-quicksand text-brand-dark">$0</span>
                <span className="text-brand-dark/40 text-xs font-light ml-1">/ forever</span>
              </div>

              {/* Perks List */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-xs text-brand-dark/80">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Unlimited text queries
                </li>
                <li className="flex items-center gap-3 text-xs text-brand-dark/80">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Free AI Models (Groq, NVIDIA, OpenRouter)
                </li>
                <li className="flex items-center gap-3 text-xs text-brand-dark/80">
                  <svg className="w-4 h-4 text-brand-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Basic Image Generation
                </li>
                <li className="flex items-center gap-3 text-xs text-brand-dark/80 opacity-40">
                  <svg className="w-4 h-4 text-brand-dark/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Vision Capabilities (Locked)
                </li>
                <li className="flex items-center gap-3 text-xs text-brand-dark/80 opacity-40">
                  <svg className="w-4 h-4 text-brand-dark/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Premium Models: Gemini, Local AI (Locked)
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full py-3.5 bg-brand-dark/5 dark:bg-brand-dark/10 text-brand-dark/45 text-xs font-bold rounded-full cursor-not-allowed border border-brand-dark/5 text-center"
            >
              {loading ? "Checking status..." : profile && profile.plan === "ultimate" ? "Downgrade in Billing Portal" : "Current Plan"}
            </button>
          </div>

          {/* Ultimate Tier Card (Elevated design) */}
          <div className="bg-brand-card border-2 border-brand-primary dark:border-brand-primary rounded-3xl p-8 flex flex-col justify-between shadow-lg shadow-brand-primary/5 dark:shadow-none relative transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-wider shadow-sm select-none">
              Most Popular
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-extrabold text-brand-primary uppercase tracking-wider font-quicksand">Ultimate</span>
                <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Unlocked</span>
              </div>
              <h3 className="text-2xl font-black font-quicksand text-brand-dark mb-2">Ultimate Plan</h3>
              <p className="text-brand-dark/60 dark:text-brand-dark/80 text-xs font-light mb-8">Unlock state-of-the-art multimodal vision, local minds, and speed.</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-black font-quicksand text-brand-dark">
                  ${billingCycle === "monthly" ? monthlyPrice : yearlyPrice}
                </span>
                <span className="text-brand-dark/40 text-xs font-light ml-1">/ month</span>
                {billingCycle === "yearly" && (
                  <span className="text-brand-dark/50 dark:text-brand-dark/65 text-[10px] font-bold ml-2">
                    (billed ${yearlyPrice * 12}/year)
                  </span>
                )}
              </div>

              {/* Perks List */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-xs text-brand-dark/80">
                  <svg className="w-4 h-4 text-brand-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <strong>Everything in Free</strong>
                </li>
                <li className="flex items-center gap-3 text-xs text-brand-dark/80">
                  <svg className="w-4 h-4 text-brand-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Vision support (attach images to messages)
                </li>
                <li className="flex items-center gap-3 text-xs text-brand-dark/80">
                  <svg className="w-4 h-4 text-brand-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Gemini 2.5 Pro Premium Model
                </li>
                <li className="flex items-center gap-3 text-xs text-brand-dark/80">
                  <svg className="w-4 h-4 text-brand-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Ollama Local Model Integration
                </li>
                <li className="flex items-center gap-3 text-xs text-brand-dark/80">
                  <svg className="w-4 h-4 text-brand-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Custom remote Cloud GPU setups
                </li>
                <li className="flex items-center gap-3 text-xs text-brand-dark/80">
                  <svg className="w-4 h-4 text-brand-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Priority queue bandwidth & speed
                </li>
              </ul>
            </div>

            {loading ? (
              <button
                disabled
                className="w-full py-3.5 bg-brand-primary/50 text-white text-xs font-bold rounded-full cursor-not-allowed text-center"
              >
                Checking Status...
              </button>
            ) : profile && profile.plan === "ultimate" ? (
              <div className="flex flex-col gap-2 w-full">
                <button
                  disabled
                  className="w-full py-3.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30 text-xs font-extrabold rounded-full text-center uppercase tracking-wider"
                >
                  You're on Ultimate ✨
                </button>
                <button
                  onClick={handleManagePortal}
                  disabled={loadingPortal}
                  className="w-full py-2 bg-brand-dark/5 hover:bg-brand-dark/10 dark:bg-brand-dark/20 dark:hover:bg-brand-dark/25 text-brand-dark text-[10px] font-extrabold rounded-full uppercase tracking-wider cursor-pointer text-center duration-150"
                >
                  {loadingPortal ? "Redirecting..." : "Manage Subscription"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={checkingOut}
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-bold rounded-full shadow-md shadow-brand-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer text-center"
              >
                {checkingOut ? "Upgrading..." : "Upgrade to Ultimate"}
              </button>
            )}
          </div>
        </div>

        {/* Three Separate Promotional Pathways */}
        <div className="max-w-4xl w-full mb-20">
          <h3 className="text-xl font-black font-quicksand text-center mb-8">Demo Upgrade Pathways</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Developer Referral Card */}
            <div className="bg-brand-card border border-brand-dark/10 dark:border-brand-dark/20 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-xs transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
              <div className="flex flex-col items-center w-full">
                <div className="w-10 h-10 rounded-full bg-brand-secondary/15 text-brand-secondary flex items-center justify-center text-lg mb-3">
                  💼
                </div>
                <h4 className="text-xs font-black font-quicksand text-brand-dark uppercase tracking-wider mb-2">Developer Referral</h4>
                <p className="text-[11px] text-brand-dark/60 dark:text-brand-dark/80 font-light leading-relaxed mb-6">
                  For creators and developers. Enter your developer key below to claim **1 year** of Ultimate access.
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <input
                  type="password"
                  value={devKeyInput}
                  onChange={(e) => setDevKeyInput(e.target.value)}
                  placeholder="Enter Dev Key"
                  className="flex-1 px-4 py-2.5 rounded-full bg-brand-bg/50 dark:bg-brand-bg/25 focus:bg-brand-bg border border-brand-dark/10 dark:border-brand-dark/20 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary/20 w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleReferralUpgrade("developer", devKeyInput);
                  }}
                />
                <button
                  onClick={() => handleReferralUpgrade("developer", devKeyInput)}
                  className="px-4 py-2.5 bg-brand-secondary hover:bg-brand-secondary/90 text-white text-xs font-extrabold rounded-full transition-colors cursor-pointer"
                >
                  Claim
                </button>
              </div>
            </div>

            {/* Redeem Code Card */}
            <div className="bg-brand-card border border-brand-dark/10 dark:border-brand-dark/20 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-xs transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
              <div className="flex flex-col items-center w-full">
                <div className="w-10 h-10 rounded-full bg-brand-dark/10 text-brand-dark/60 dark:bg-brand-dark/20 dark:text-brand-dark/85 flex items-center justify-center text-lg mb-3">
                  🔑
                </div>
                <h4 className="text-xs font-black font-quicksand text-brand-dark uppercase tracking-wider mb-2">Redeem Promo Code</h4>
                <p className="text-[11px] text-brand-dark/60 dark:text-brand-dark/80 font-light leading-relaxed mb-6">
                  Have an access code? Enter it below (use code <code className="bg-brand-dark/5 px-1.5 py-0.5 rounded font-mono font-bold text-brand-primary">ULTIMATE</code>).
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 px-4 py-2.5 rounded-full bg-brand-bg/50 dark:bg-brand-bg/25 focus:bg-brand-bg border border-brand-dark/10 dark:border-brand-dark/20 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary/20 w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRedeemCode();
                  }}
                />
                <button
                  onClick={() => handleRedeemCode()}
                  className="px-4 py-2.5 bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-brand-dark/20 dark:text-brand-dark dark:hover:bg-brand-dark/25 text-xs font-extrabold rounded-full transition-colors cursor-pointer"
                >
                  Redeem
                </button>
              </div>
            </div>

            {/* Tester Referral Card */}
            <div className="bg-brand-card border border-brand-dark/10 dark:border-brand-dark/20 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-xs transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-lg mb-3">
                  🧪
                </div>
                <h4 className="text-xs font-black font-quicksand text-brand-dark uppercase tracking-wider mb-2">Tester Referral</h4>
                <p className="text-[11px] text-brand-dark/60 dark:text-brand-dark/80 font-light leading-relaxed mb-6">
                  For early beta testers and partners. Instantly activates the Ultimate plan for **3 months** for free.
                </p>
              </div>
              <button
                onClick={() => handleReferralUpgrade("tester")}
                className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-extrabold rounded-full transition-colors cursor-pointer"
              >
                Claim Tester Referral (3Mo)
              </button>
            </div>

          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full max-w-2xl mb-12">
          <h3 className="text-2xl font-black font-quicksand text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-brand-card/85 dark:bg-brand-card/65 border border-brand-dark/5 dark:border-brand-dark/20 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left px-6 py-4.5 font-bold text-xs sm:text-sm font-quicksand flex items-center justify-between gap-4 cursor-pointer hover:bg-brand-dark/5 dark:hover:bg-brand-dark/10 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <svg
                      className={`w-4 h-4 text-brand-dark/50 transform transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-brand-primary" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs text-brand-dark/75 dark:text-brand-dark/85 font-light leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upgrade Options Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-brand-dark/40 dark:bg-brand-dark/60 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
          />
          {/* dialog box */}
          <div className="bg-brand-card border border-brand-dark/10 dark:border-brand-dark/25 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-brand-dark/10 dark:border-brand-dark/20 pb-3">
              <h3 className="text-lg font-black font-quicksand text-brand-dark">Upgrade Options</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-brand-dark/50 hover:text-brand-dark p-1 hover:bg-brand-dark/5 rounded-full cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-brand-dark/70 dark:text-brand-dark/80 font-light leading-relaxed mb-6">
              NexInc is currently in demo/preview mode. You can test the full Stripe checkout flow or use free developer pathways to upgrade.
            </p>

            <div className="space-y-3">
              {/* Option 1: Stripe */}
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  handleUpgrade();
                }}
                className="w-full p-4 rounded-2xl bg-brand-bg/50 hover:bg-brand-bg/85 dark:bg-brand-bg/25 dark:hover:bg-brand-bg/35 border border-brand-dark/10 dark:border-brand-dark/20 text-left flex items-start gap-3 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:scale-110 duration-150">
                  💳
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-dark">Test Stripe Checkout</p>
                  <p className="text-[10px] text-brand-dark/50 font-light">Redirect to Stripe test checkout page. Use card number 4242...</p>
                </div>
              </button>

              {/* Option 2: Developer Referral */}
              <div className="w-full p-4 rounded-2xl bg-brand-bg/50 border border-brand-dark/10 dark:border-brand-dark/20 text-left flex flex-col gap-3 transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setShowModalDevInput(!showModalDevInput)}
                  className="w-full flex items-start gap-3 text-left cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-secondary/15 text-brand-secondary flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:scale-110 duration-150">
                    💼
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-brand-dark">Developer Referral (1 Year)</p>
                    <p className="text-[10px] text-brand-dark/50 font-light">Claim 365 days of free premium developer access.</p>
                  </div>
                </button>
                {showModalDevInput && (
                  <div className="flex gap-2 items-center w-full pl-11 animate-in slide-in-from-top-1 duration-150">
                    <input
                      type="password"
                      value={modalDevKey}
                      onChange={(e) => setModalDevKey(e.target.value)}
                      placeholder="Enter Dev Key"
                      className="flex-1 px-3 py-1.5 rounded-full bg-brand-card focus:bg-brand-bg border border-brand-dark/10 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleReferralUpgrade("developer", modalDevKey);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleReferralUpgrade("developer", modalDevKey)}
                      className="px-3 py-1.5 bg-brand-secondary hover:bg-brand-secondary/90 text-white text-[10px] font-extrabold rounded-full transition-colors cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>
                )}
              </div>

              {/* Option 3: Tester Referral */}
              <button
                onClick={() => handleReferralUpgrade("tester")}
                className="w-full p-4 rounded-2xl bg-brand-bg/50 hover:bg-brand-bg/85 dark:bg-brand-bg/25 dark:hover:bg-brand-bg/35 border border-brand-dark/10 dark:border-brand-dark/20 text-left flex items-start gap-3 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:scale-110 duration-150">
                  🧪
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-dark">Beta Tester Referral (3 Months)</p>
                  <p className="text-[10px] text-brand-dark/50 font-light">Instantly activate Ultimate plan for 90 days for free.</p>
                </div>
              </button>

              {/* Option 3: Code */}
              <button
                onClick={() => {
                  handleRedeemCode("ULTIMATE");
                }}
                className="w-full p-4 rounded-2xl bg-brand-bg/50 hover:bg-brand-bg/85 dark:bg-brand-bg/25 dark:hover:bg-brand-bg/35 border border-brand-dark/10 dark:border-brand-dark/20 text-left flex items-start gap-3 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-brand-dark/10 text-brand-dark/60 dark:bg-brand-dark/20 dark:text-brand-dark/80 flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:scale-110 duration-150">
                  🔑
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-dark">Redeem Code 'ULTIMATE'</p>
                  <p className="text-[10px] text-brand-dark/50 font-light">Immediately unlock the Ultimate plan via simulated promo code.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
