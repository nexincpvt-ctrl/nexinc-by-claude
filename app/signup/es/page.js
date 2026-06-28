import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — Crear Cuenta",
  description: "Cree su cuenta de NexInc.",
};

export default function SignupPageEs() {
  return <LoginComponent lang="es" defaultTab="signup" />;
}
