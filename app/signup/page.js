"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const router = useRouter();
  const supabase = createClient();

  const handleValidation = () => {
    const tempErrors = {};
    if (!name.trim()) {
      tempErrors.name = "Tell us what to call you! We'd love to know your name.";
    }
    if (!email.trim()) {
      tempErrors.email = "We need an email address so we can secure your account.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Hmm, that doesn't look like a valid email address — double check it?";
    }
    if (!password) {
      tempErrors.password = "A password is required to keep your account safe.";
    } else if (password.length < 6) {
      tempErrors.password = "Passwords need to be at least 6 characters long.";
    }
    if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Oops, those passwords didn't match — try typing them again!";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        const msg = error.message === "{}" || !error.message
          ? "Hmm, we couldn't reach our security servers. Please check your internet connection and try again!"
          : error.message;
        setErrors({ submit: msg });
      } else {
        // Immediately redirect to /verify-otp page with email query parameter
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      setErrors({ submit: "Something went wrong. Let's try again in a moment!" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setErrors({ submit: error.message });
    } catch (err) {
      setErrors({ submit: "Could not connect to Google right now — try again shortly." });
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto my-12">
      <div className="bg-brand-card p-8 sm:p-10 rounded-3xl shadow-xl shadow-brand-dark/5 border border-brand-dark/5 w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3">
            <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-md shadow-brand-primary/20">
              <span className="text-2xl text-white font-bold">N</span>
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold font-quicksand text-brand-dark">
            Join NexInc
          </h2>
          <p className="text-brand-dark/60 text-sm mt-1">
            Let's get your account set up!
          </p>
        </div>

        {errors.submit && (
          <div className="p-4 mb-6 bg-brand-error/10 border border-brand-error/25 text-brand-error text-sm rounded-2xl">
            {errors.submit}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/60 mb-1 ml-1 select-none">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Smith"
              className="w-full px-4 py-3 rounded-2xl bg-brand-bg/50 text-brand-dark focus:bg-brand-bg focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all duration-200 shadow-sm placeholder:text-brand-dark/30 border border-transparent"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-xs text-brand-error mt-1 ml-1 font-medium">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/60 mb-1 ml-1 select-none">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-2xl bg-brand-bg/50 text-brand-dark focus:bg-brand-bg focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all duration-200 shadow-sm placeholder:text-brand-dark/30 border border-transparent"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-xs text-brand-error mt-1 ml-1 font-medium">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/60 mb-1 ml-1 select-none">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl bg-brand-bg/50 text-brand-dark focus:bg-brand-bg focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all duration-200 shadow-sm placeholder:text-brand-dark/30 border border-transparent"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-xs text-brand-error mt-1 ml-1 font-medium">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/60 mb-1 ml-1 select-none">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl bg-brand-bg/50 text-brand-dark focus:bg-brand-bg focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all duration-200 shadow-sm placeholder:text-brand-dark/30 border border-transparent"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-brand-error mt-1 ml-1 font-medium">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-brand-primary text-white font-semibold rounded-full shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-dark/10"></div>
          </div>
          <span className="relative bg-brand-card px-3 text-xs uppercase tracking-wider text-brand-dark/40 font-medium">
            Or
          </span>
        </div>

        <button
          onClick={handleGoogleSignup}
          type="button"
          className="w-full py-3.5 border-2 border-brand-dark/10 hover:border-brand-dark/20 text-brand-dark font-medium rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2 bg-brand-card disabled:opacity-50 cursor-pointer"
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.6 15.02 1 12 1 7.35 1 3.4 3.67 1.5 7.56l3.86 3c.9-2.7 3.42-4.52 6.64-4.52z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.68 2.85c2.15-1.98 3.39-4.9 3.39-8.53z"
            />
            <path
              fill="#FBBC05"
              d="M5.36 10.56c-.23-.69-.36-1.43-.36-2.2 0-.77.13-1.51.36-2.2l-3.86-3C.68 4.72 0 6.94 0 9.36s.68 4.64 1.5 6.2l3.86-3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.68-2.85c-1.12.75-2.55 1.2-4.28 1.2-3.22 0-5.74-1.82-6.64-4.52l-3.86 3C3.4 20.33 7.35 23 12 23z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-sm text-center text-brand-dark/70 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-primary hover:underline font-semibold"
          >
            Log In
          </Link>
        </p>
      </div>
    </main>
  );
}
