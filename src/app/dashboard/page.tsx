import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, CheckCircle, Users, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Lấy thống kê
  const { count: totalCodes } = await supabase
    .from("bracelet_codes")
    .select("*", { count: "exact", head: true });

  const { count: activatedCodes } = await supabase
    .from("bracelet_codes")
    .select("*", { count: "exact", head: true })
    .eq("is_activated", true);

  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  const { count: winnersCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("has_won", true);

  const stats = [
    {
      title: "Tổng mã vòng tay",
      value: totalCodes || 0,
      icon: Tag,
      color: "text-blue-600",
      bg: "bg-blue-100",
      href: "/dashboard/bracelet-codes",
    },
    {
      title: "Đã kích hoạt",
      value: activatedCodes || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Tổng khách hàng",
      value: totalCustomers || 0,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100",
      href: "/dashboard/customers",
    },
    {
      title: "Người trúng thưởng",
      value: winnersCount || 0,
      icon: Sparkles,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Tổng quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <Card className={stat.href ? "hover:shadow-lg transition-shadow cursor-pointer" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          if (stat.href) {
            return (
              <Link key={stat.title} href={stat.href}>
                {content}
              </Link>
            );
          }

          return <div key={stat.title}>{content}</div>;
        })}
      </div>
    </div>
  );
}
