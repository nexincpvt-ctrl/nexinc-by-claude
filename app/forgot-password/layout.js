export const metadata = {
  title: "Forgot Password",
  description:
    "Reset your NexInc password. Enter your email to receive a secure password reset link.",
  alternates: {
    canonical: "https://nexinc.vercel.app/forgot-password",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordLayout({ children }) {
  return children;
}
