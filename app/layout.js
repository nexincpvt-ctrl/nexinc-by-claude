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
  title: "NexInc",
  description: "Your friendly, unified portal to the world's most powerful AI minds.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text font-sans transition-colors duration-300">
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
