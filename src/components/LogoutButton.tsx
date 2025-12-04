"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <LogOut className="h-4 w-4" />
      Đăng xuất
    </Button>
  );
}
