import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — साइन इन",
  description: "नेक्सइंक में साइन इन करें।",
};

export default function LoginPageHi() {
  return <LoginComponent lang="hi" defaultTab="signin" />;
}
