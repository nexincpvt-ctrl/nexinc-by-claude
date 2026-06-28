import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — Créer un Compte",
  description: "Créez votre compte NexInc.",
};

export default function SignupPageFr() {
  return <LoginComponent lang="fr" defaultTab="signup" />;
}
