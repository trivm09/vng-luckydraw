import { createClient } from "@/lib/supabase/server";
import CustomersTable from "./CustomersTable";

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Lỗi khi tải dữ liệu: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý khách hàng</h1>
      </div>

      <CustomersTable initialCustomers={customers || []} />
    </div>
  );
}
