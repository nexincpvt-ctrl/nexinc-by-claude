import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      {/* Friendly Logo Placeholder */}
      <div className="w-16 h-16 bg-brand-primary rounded-3xl flex items-center justify-center shadow-lg shadow-brand-primary/20 mb-8 animate-bounce">
        <span className="text-3xl text-white font-bold select-none">N</span>
      </div>

      {/* Hero Section */}
      <h1 className="text-5xl font-extrabold tracking-tight text-brand-dark mb-4 font-quicksand leading-tight">
        NexInc
      </h1>
      
      <p className="text-lg text-brand-dark/80 mb-10 leading-relaxed font-light max-w-sm">
        Your friendly, unified portal to the world's most powerful AI minds. Let's chat!
      </p>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link
          href="/signup"
          className="px-8 py-3.5 bg-brand-primary text-white font-semibold rounded-full shadow-md shadow-brand-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-primary/30 hover:scale-[1.02] active:scale-[0.98] text-center"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-8 py-3.5 bg-brand-secondary text-white font-semibold rounded-full shadow-md shadow-brand-secondary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-secondary/30 hover:scale-[1.02] active:scale-[0.98] text-center"
        >
          Log In
        </Link>
      </div>
      
      {/* Decorative footer styling */}
      <div className="mt-16 text-xs text-brand-dark/40 font-light">
        © {new Date().getFullYear()} NexInc. Built with love and warm tea.
      </div>
    </main>
  );
}
