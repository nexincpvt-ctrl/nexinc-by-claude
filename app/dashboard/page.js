import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/queries";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double check auth inside component
  if (!user) {
    redirect("/login");
  }

  // Retrieve user's profile from database, fallback if profile creation failed/delayed
  let profile = null;
  try {
    profile = await getProfile(supabase, user.id);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    profile = {
      id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0],
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url || "",
      plan: "free",
    };
  }

  return (
    <main className="dashboard-page-body flex-1 flex flex-col h-screen overflow-hidden">
      <DashboardClient initialProfile={profile} />
    </main>
  );
}
