import { Quicksand, Nunito } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import Script from "next/script";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://nexinc.vercel.app"),
  title: {
    default: "NexInc — AI Chat Platform",
    template: "%s | NexInc",
  },
  description:
    "Your friendly, unified portal to the world's most powerful AI minds. Chat with GPT, Gemini, Claude, Mistral, DeepSeek, and more — all in one place.",
  keywords: [
    "AI chat",
    "GPT",
    "Gemini",
    "Claude",
    "Mistral",
    "DeepSeek",
    "AI platform",
    "NexInc",
    "unified AI",
    "chatbot",
    "LLM",
    "artificial intelligence",
  ],
  authors: [{ name: "NexInc" }],
  creator: "NexInc",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nexinc.vercel.app",
    siteName: "NexInc",
    title: "NexInc — AI Chat Platform",
    description:
      "Your friendly, unified portal to the world's most powerful AI minds. Chat with GPT, Gemini, Claude, Mistral, DeepSeek, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexInc — AI Chat Platform",
    description:
      "Your friendly, unified portal to the world's most powerful AI minds.",
  },
  alternates: {
    canonical: "https://nexinc.vercel.app",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

// JSON-LD Structured Data (Organization + WebSite schemas)
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://nexinc.vercel.app/#organization",
      name: "NexInc",
      url: "https://nexinc.vercel.app",
      description:
        "A unified AI chat platform providing access to the world's most powerful AI models.",
    },
    {
      "@type": "WebSite",
      "@id": "https://nexinc.vercel.app/#website",
      url: "https://nexinc.vercel.app",
      name: "NexInc",
      publisher: { "@id": "https://nexinc.vercel.app/#organization" },
      description:
        "Chat with GPT, Gemini, Claude, Mistral, DeepSeek, and more — all in one place.",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text font-sans transition-colors duration-300">
        <Script
          id="ld-json"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'default';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'wg' || theme === 'wb') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
