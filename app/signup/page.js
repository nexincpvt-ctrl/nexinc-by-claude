import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — Create Account",
  description: "Create your NexInc account.",
};

export default function SignupPage() {
  return <LoginComponent lang="en" defaultTab="signup" />;
}
