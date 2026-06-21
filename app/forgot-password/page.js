"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please fill in your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        const msg = error.message === "{}" || !error.message
          ? "Hmm, we couldn't reach our security servers. Please check your internet connection and try again!"
          : error.message;
        setError(msg);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("We encountered an issue sending the email. Let's try again in a moment!");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="bg-brand-card p-8 sm:p-10 rounded-3xl shadow-xl shadow-brand-dark/5 border border-brand-dark/5 w-full">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-primary text-3xl">
            ✨
          </div>
          <h2 className="text-3xl font-bold font-quicksand text-brand-dark mb-4">
            Reset link sent
          </h2>
          <p className="text-brand-dark/80 mb-6 leading-relaxed">
            We've sent a friendly password reset link to <strong className="text-brand-primary">{email}</strong>.
          </p>
          <p className="text-sm text-brand-dark/60 mb-8 leading-relaxed">
            Check your inbox (and maybe spam folders) to set up a new password for NexInc!
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-brand-secondary text-white font-semibold rounded-full shadow-md shadow-brand-secondary/20 hover:shadow-lg hover:shadow-brand-secondary/30 transition-all duration-200"
          >
            Back to Log In
          </Link>
        </div>
      </main>
    );
  }

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
            Reset Password
          </h2>
          <p className="text-brand-dark/60 text-sm mt-1">
            We'll send a password reset link to your email.
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-brand-error/10 border border-brand-error/25 text-brand-error text-sm rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-brand-primary text-white font-semibold rounded-full shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Sending reset link..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-sm text-center text-brand-dark/70 mt-6">
          Remembered your password?{" "}
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
