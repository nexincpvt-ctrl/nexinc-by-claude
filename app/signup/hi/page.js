import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — खाता बनाएं",
  description: "नेक्सइंक में अपना खाता बनाएं।",
};

export default function SignupPageHi() {
  return <LoginComponent lang="hi" defaultTab="signup" />;
}
