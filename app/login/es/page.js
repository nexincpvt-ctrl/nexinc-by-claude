import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — Iniciar Sesión",
  description: "Inicie sesión en NexInc.",
};

export default function LoginPageEs() {
  return <LoginComponent lang="es" defaultTab="signin" />;
}
