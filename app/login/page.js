import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — Sign In",
  description: "Sign in to NexInc.",
};

export default function LoginPage() {
  return <LoginComponent lang="en" defaultTab="signin" />;
}
