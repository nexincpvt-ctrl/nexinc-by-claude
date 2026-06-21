"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OtpInput from "@/components/OtpInput";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [resendStatus, setResendStatus] = useState("");

  const supabase = createClient();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown === 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleVerify = async (code) => {
    if (!email) {
      setError("Oops! We don't have an email address to verify. Try signing up again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });

      if (error) {
        const msg = error.message === "{}" || !error.message
          ? "Hmm, we couldn't reach our security servers. Please check your internet connection and try again!"
          : "That code doesn't match — check and try again.";
        setError(msg);
      } else {
        setSuccess(true);
        // Redirect to dashboard after a short success display
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError("Something went wrong. Let's try verifying again in a moment!");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setResendStatus("sending");
    setError("");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        setError(`Could not resend code: ${error.message}`);
        setResendStatus("error");
      } else {
        setCooldown(30);
        setResendStatus("sent");
        // Clear status text after a few seconds
        setTimeout(() => setResendStatus(""), 4000);
      }
    } catch (err) {
      setError("Could not resend the code. Please try again shortly.");
      setResendStatus("error");
    }
  };

  return (
    <div className="bg-brand-card p-8 sm:p-10 rounded-3xl shadow-xl shadow-brand-dark/5 border border-brand-dark/5 w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-md shadow-brand-primary/20 mx-auto mb-3">
          <span className="text-2xl text-white font-bold">N</span>
        </div>
        <h2 className="text-3xl font-extrabold font-quicksand text-brand-dark">
          Confirm Your Account
        </h2>
        <p className="text-brand-dark/70 text-sm mt-3 leading-relaxed">
          We sent an 8-digit code to <strong className="text-brand-primary break-all">{email || "your email"}</strong>.
          Enter it below to confirm your account.
        </p>
      </div>

      {success ? (
        <div className="text-center py-6 space-y-3">
          <span className="text-4xl inline-block animate-bounce">🎉</span>
          <h3 className="text-xl font-bold text-brand-success font-quicksand">
            You're verified!
          </h3>
          <p className="text-sm text-brand-dark/60">
            Welcome aboard! Taking you to your dashboard...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-brand-error/10 border border-brand-error/25 text-brand-error text-sm rounded-2xl text-center">
              {error}
            </div>
          )}

          {/* Reusable OTP entry field */}
          <div className="py-2">
            <OtpInput length={8} onComplete={handleVerify} />
          </div>

          <div className="text-center text-sm">
            {resendStatus === "sending" ? (
              <p className="text-brand-dark/50">Sending a new code...</p>
            ) : resendStatus === "sent" ? (
              <p className="text-brand-success font-semibold">✓ A new code has been sent!</p>
            ) : cooldown > 0 ? (
              <p className="text-brand-dark/50">
                Resend code in <span className="font-semibold text-brand-primary">{cooldown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-brand-primary font-semibold hover:underline cursor-pointer"
              >
                Didn't receive a code? Resend code
              </button>
            )}
          </div>

          <p className="text-sm text-center text-brand-dark/70 pt-2 border-t border-brand-dark/5">
            Wrong email address?{" "}
            <Link
              href="/signup"
              className="text-brand-primary hover:underline font-semibold"
            >
              Sign Up again
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-xl mx-auto my-12">
      <Suspense fallback={
        <div className="bg-brand-card p-10 rounded-3xl shadow-xl shadow-brand-dark/5 border border-brand-dark/5 w-full text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
          <p className="text-brand-dark/60 mt-4 text-sm font-quicksand">Loading verification portal...</p>
        </div>
      }>
        <VerifyOtpContent />
      </Suspense>
    </main>
  );
}
