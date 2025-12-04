import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Home, Tag, Users, LogOut, Sparkles } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">Lucky Draw</h1>
          <p className="text-muted-foreground text-sm mt-1 truncate">
            {user.email}
          </p>
        </div>

        <Separator />

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Home className="h-4 w-4" />
              Trang chủ
            </Button>
          </Link>

          <Link href="/dashboard/bracelet-codes">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Tag className="h-4 w-4" />
              Mã vòng tay
            </Button>
          </Link>

          <Link href="/dashboard/customers">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Users className="h-4 w-4" />
              Khách hàng
            </Button>
          </Link>

          <Link href="/dashboard/draw-control">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Sparkles className="h-4 w-4" />
              Quay số
            </Button>
          </Link>
        </nav>

        <Separator />

        <div className="p-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  );
}
