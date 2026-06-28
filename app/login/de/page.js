import LoginComponent from "@/components/LoginComponent";

export const metadata = {
  title: "NexInc — Anmelden",
  description: "Melden Sie sich bei NexInc an.",
};

export default function LoginPageDe() {
  return <LoginComponent lang="de" defaultTab="signin" />;
}
