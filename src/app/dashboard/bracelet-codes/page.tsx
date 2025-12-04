import { createClient } from "@/lib/supabase/server";
import BraceletCodesTable from "./BraceletCodesTable";

export default async function BraceletCodesPage() {
  const supabase = await createClient();

  const { data: codes, error } = await supabase
    .from("bracelet_codes")
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
        <h1 className="text-2xl font-bold">Quản lý mã vòng tay</h1>
      </div>

      <BraceletCodesTable initialCodes={codes || []} />
    </div>
  );
}
