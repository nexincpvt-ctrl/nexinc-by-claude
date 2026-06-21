import { Quicksand, Nunito } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

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
      <head>
        {/* Anti-flash theme check script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-dark font-sans transition-colors duration-300">
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
