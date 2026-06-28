"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { translations } from "@/lib/translations";
import "@/app/login/login.css";

export default function LoginComponent({ lang = "en", defaultTab = "signin" }) {
  const t = translations[lang] || translations.en;
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState(defaultTab);

  // Signin form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup form state
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Shake states for inputs
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePass, setShakePass] = useState(false);
  const [shakeSuName, setShakeSuName] = useState(false);
  const [shakeSuEmail, setShakeSuEmail] = useState(false);
  const [shakeSuPass, setShakeSuPass] = useState(false);

  const sceneWrapRef = useRef(null);
  const sceneRef = useRef(null);

  // Parallax physics effect
  useEffect(() => {
    const sceneWrap = sceneWrapRef.current;
    const scene = sceneRef.current;
    if (!sceneWrap || !scene) return;

    let rafId = null;

    const handleMouseMove = (e) => {
      const rect = sceneWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rx = 55 - y * 14;
        const rz = 45 + x * 14;
        scene.style.transform = `rotateX(${rx}deg) rotateZ(${rz}deg)`;
      });
    };

    const handleMouseLeave = () => {
      if (rafId) cancelAnimationFrame(rafId);
      scene.style.transform = "rotateX(55deg) rotateZ(45deg)";
    };

    sceneWrap.addEventListener("mousemove", handleMouseMove);
    sceneWrap.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      sceneWrap.removeEventListener("mousemove", handleMouseMove);
      sceneWrap.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Validation routines
  const validateSignin = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      tempErrors.email = t.errEmail;
      setShakeEmail(true);
    }
    if (password.length < 6) {
      tempErrors.password = t.errPass;
      setShakePass(true);
    }

    setErrors(tempErrors);

    setTimeout(() => {
      setShakeEmail(false);
      setShakePass(false);
    }, 400);

    return Object.keys(tempErrors).length === 0;
  };

  const validateSignup = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!suName.trim()) {
      tempErrors.suName = t.errName;
      setShakeSuName(true);
    }
    if (!emailRegex.test(suEmail)) {
      tempErrors.suEmail = t.errEmail;
      setShakeSuEmail(true);
    }
    if (suPassword.length < 6) {
      tempErrors.suPassword = t.errPass;
      setShakeSuPass(true);
    }

    setErrors(tempErrors);

    setTimeout(() => {
      setShakeSuName(false);
      setShakeSuEmail(false);
      setShakeSuPass(false);
    }, 400);

    return Object.keys(tempErrors).length === 0;
  };

  // Auth actions
  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validateSignin()) return;

    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed") || error.message.toLowerCase().includes("email not verified")) {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        } else if (error.message.toLowerCase().includes("invalid login credentials")) {
          setErrors({ submit: t.errSubmit });
        } else {
          setErrors({ submit: error.message });
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validateSignup()) return;

    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signUp({
        email: suEmail,
        password: suPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: suName,
          },
        },
      });

      if (error) {
        setErrors({ submit: error.message });
      } else {
        router.push(`/verify-otp?email=${encodeURIComponent(suEmail)}`);
      }
    } catch (err) {
      setErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setErrors({ submit: error.message });
    } catch (err) {
      setErrors({ submit: `Could not connect to ${provider}. Please try again.` });
      setLoading(false);
    }
  };

  const handleLangChange = (e) => {
    const targetLang = e.target.value;
    let base = activeTab === "signup" ? "/signup" : "/login";
    if (targetLang === "en") {
      router.push(base);
    } else {
      router.push(`${base}/${targetLang}`);
    }
  };

  const toggleTab = (tab) => {
    setActiveTab(tab);
    setErrors({});
    
    // Smoothly update route in background to match current active tab
    const urlLang = lang === "en" ? "" : `/${lang}`;
    router.replace(`${tab === "signup" ? "/signup" : "/login"}${urlLang}`);
  };

  return (
    <div className="login-page-body">
      {/* Language Selector Dropdown */}
      <div className="lang-selector">
        <select value={lang} onChange={handleLangChange} className="lang-select">
          <option value="en">English (EN)</option>
          <option value="es">Español (ES)</option>
          <option value="hi">हिन्दी (HI)</option>
          <option value="fr">Français (FR)</option>
          <option value="de">Deutsch (DE)</option>
        </select>
      </div>

      <div className="stage">
        {/* LEFT CONSOLE */}
        <div className="console">
          <div className="console-header">
            <div className="dot-row">
              <div className="dot live"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            {t.runtimeInfo}
          </div>

          <div className="scene-wrap" ref={sceneWrapRef}>
            <div className="scene" ref={sceneRef}>
              <div className="beam b1"></div>
              <div className="beam b2"></div>
              <div className="beam b3"></div>
              <div className="beam b4"></div>

              <div className="node n5"><div className="face top"></div><div className="face side-r"></div><div className="face side-b"></div></div>
              <div className="node n1"><div className="face top"></div><div className="face side-r"></div><div className="face side-b"></div></div>
              <div className="node n2"><div className="face top"></div><div className="face side-r"></div><div className="face side-b"></div></div>
              <div className="node n3"><div className="face top"></div><div className="face side-r"></div><div className="face side-b"></div></div>
              <div className="node n4"><div className="face top"></div><div className="face side-r"></div><div className="face side-b"></div></div>
            </div>
          </div>

          <div className="scene-caption">
            <div className="label">{t.modelMesh}</div>
            <h1>{t.captionTitle1}<br />{t.captionTitle2}<span>{t.captionTitle3}</span>.</h1>
          </div>

          <div className="ticker">
            <span><b>6</b> {t.themesLoaded}</span>
            <span><b>{t.uptime}</b> 99.98%</span>
            <span><b>{t.node}</b> gemini-2.5-pro</span>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="formside">
          <div className="card">
            <div className="brand">
              <div className="brand-mark"></div>
              <div className="brand-name">NEXINC</div>
            </div>

            <div className="mode-row">
              <button
                className={`mode-btn ${activeTab === "signin" ? "active" : ""}`}
                onClick={() => toggleTab("signin")}
                type="button"
              >
                {t.signInBtn}
              </button>
              <button
                className={`mode-btn ${activeTab === "signup" ? "active" : ""}`}
                onClick={() => toggleTab("signup")}
                type="button"
              >
                {t.createAccountLink}
              </button>
            </div>

            {errors.submit && (
              <div className="p-4 mb-4 bg-[#FF6B5C]/10 border border-[#FF6B5C]/25 text-[#FF6B5C] text-sm rounded font-mono">
                {errors.submit}
              </div>
            )}

            {activeTab === "signin" ? (
              <div id="panelSignin">
                <h2>{t.welcomeBack}</h2>
                <p className="sub">{t.subSignin}</p>

                <form onSubmit={handleSigninSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="email">{t.email}</label>
                    <div className={`input-wrap ${shakeEmail ? "shake" : ""}`}>
                      <input
                        type="email"
                        id="email"
                        placeholder={t.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className={`err-msg ${errors.email ? "show" : ""}`}>
                      {errors.email}
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="password">{t.password}</label>
                    <div className={`input-wrap ${shakePass ? "shake" : ""}`}>
                      <input
                        type={passwordVisible ? "text" : "password"}
                        id="password"
                        placeholder={t.passwordPlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-eye"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        aria-label="Show password"
                      >
                        {passwordVisible ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a18.4 18.4 0 014.06-5.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19M1 1l22 22M9.5 9.6a3 3 0 004.2 4.2" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className={`err-msg ${errors.password ? "show" : ""}`}>
                      {errors.password}
                    </div>
                  </div>

                  <div className="row-between">
                    <label className="check-row">
                      <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      {t.rememberMe}
                    </label>
                    <Link href="/forgot-password" className="forgot">
                      {t.forgotPassword}
                    </Link>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    <span className="shine"></span>
                    <span>{loading ? t.signingIn : t.signInBtn}</span>
                  </button>
                </form>

                <div className="divider">{t.orContinueWith}</div>

                <div className="oauth-grid">
                  <button className="oauth-btn" onClick={() => handleOAuthLogin("google")} disabled={loading} type="button">
                    <svg viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {t.google}
                  </button>
                  <button className="oauth-btn" onClick={() => handleOAuthLogin("github")} disabled={loading} type="button">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.01-2.13-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.26 5.7.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.67.79.55C20.21 21.39 23.5 17.09 23.5 12 23.5 5.65 18.35.5 12 .5z" />
                    </svg>
                    {t.github}
                  </button>
                </div>

                <div className="footer-link">
                  {t.newToNexinc}{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); toggleTab("signup"); }}>
                    {t.createAccountLink}
                  </a>
                </div>
              </div>
            ) : (
              <div id="panelSignup">
                <h2>{t.createAccountTitle}</h2>
                <p className="sub">{t.subSignup}</p>

                <form onSubmit={handleSignupSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="suName">{t.fullName}</label>
                    <div className={`input-wrap ${shakeSuName ? "shake" : ""}`}>
                      <input
                        type="text"
                        id="suName"
                        placeholder={t.fullNamePlaceholder}
                        value={suName}
                        onChange={(e) => setSuName(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className={`err-msg ${errors.suName ? "show" : ""}`}>
                      {errors.suName}
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="suEmail">{t.email}</label>
                    <div className={`input-wrap ${shakeSuEmail ? "shake" : ""}`}>
                      <input
                        type="email"
                        id="suEmail"
                        placeholder={t.emailPlaceholder}
                        value={suEmail}
                        onChange={(e) => setSuEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className={`err-msg ${errors.suEmail ? "show" : ""}`}>
                      {errors.suEmail}
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="suPassword">{t.password}</label>
                    <div className={`input-wrap ${shakeSuPass ? "shake" : ""}`}>
                      <input
                        type="password"
                        id="suPassword"
                        placeholder={t.passwordPlaceholderSignup}
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className={`err-msg ${errors.suPassword ? "show" : ""}`}>
                      {errors.suPassword}
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    <span className="shine"></span>
                    <span>{loading ? t.creatingAccount : t.createAccountBtn}</span>
                  </button>
                </form>

                <div className="footer-link" style={{ marginTop: "18px" }}>
                  {t.alreadyHaveAccount}{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); toggleTab("signin"); }}>
                    {t.signInBtn}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
