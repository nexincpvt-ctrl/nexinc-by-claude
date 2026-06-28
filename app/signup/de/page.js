import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — Konto erstellen",
  description: "Erstellen Sie Ihr NexInc-Konto.",
};

export default function SignupPageDe() {
  return <LoginComponent lang="de" defaultTab="signup" />;
}
