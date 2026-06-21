"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-6 py-2.5 bg-brand-secondary text-white font-semibold rounded-full shadow-md shadow-brand-secondary/20 hover:shadow-lg hover:shadow-brand-secondary/30 transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]"
    >
      Log Out
    </button>
  );
}
