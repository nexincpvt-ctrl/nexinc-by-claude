import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — Se Connecter",
  description: "Connectez-vous à NexInc.",
};

export default function LoginPageFr() {
  return <LoginComponent lang="fr" defaultTab="signin" />;
}
