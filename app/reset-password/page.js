"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleValidation = () => {
    const tempErrors = {};
    if (!password) {
      tempErrors.password = "Please enter a new password.";
    } else if (password.length < 6) {
      tempErrors.password = "Passwords must be at least 6 characters long.";
    }
    if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Oops, those passwords didn't match — try typing them again!";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        const msg = error.message === "{}" || !error.message
          ? "Hmm, we couldn't reach our security servers. Please check your internet connection and try again!"
          : error.message;
        setErrors({ submit: msg });
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      setErrors({ submit: "Could not update your password. Let's try again in a moment!" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="bg-brand-card p-8 sm:p-10 rounded-3xl shadow-xl shadow-brand-dark/5 border border-brand-dark/5 w-full">
          <div className="w-16 h-16 bg-brand-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-success text-3xl">
            🎉
          </div>
          <h2 className="text-3xl font-bold font-quicksand text-brand-dark mb-4">
            Password updated!
          </h2>
          <p className="text-brand-dark/80 mb-6 leading-relaxed">
            Your new password has been successfully saved.
          </p>
          <p className="text-sm text-brand-dark/60 leading-relaxed animate-pulse">
            Redirecting you to the dashboard...
          </p>
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
            Choose a Password
          </h2>
          <p className="text-brand-dark/60 text-sm mt-1">
            Please enter your new password below.
          </p>
        </div>

        {errors.submit && (
          <div className="p-4 mb-6 bg-brand-error/10 border border-brand-error/25 text-brand-error text-sm rounded-2xl">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/60 mb-1 ml-1 select-none">
              New Password
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
              Confirm New Password
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
            {loading ? "Updating password..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
