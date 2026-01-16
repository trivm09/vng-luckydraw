"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Trash2, Power, PowerOff, Download } from "lucide-react";

interface BraceletCode {
  id: string;
  code: string;
  is_activated: boolean;
  activated_at: string | null;
  created_at: string;
}

interface Props {
  initialCodes: BraceletCode[];
}

export default function BraceletCodesTable({ initialCodes }: Props) {
  const [codes, setCodes] = useState(initialCodes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeactivateAllDialog, setShowDeactivateAllDialog] = useState(false);
  const [deactivatingAll, setDeactivatingAll] = useState(false);
  const [showActivateAllDialog, setShowActivateAllDialog] = useState(false);
  const [activatingAll, setActivatingAll] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const { toast } = useToast();
  const supabase = createClient();

  const handleExportTemplate = () => {
    // Create template with headers and sample data
    const templateData = [
      ["Mã vòng tay"],
      ["VNG2024001"],
      ["VNG2024002"],
      ["VNG2024003"],
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column width
    ws["!cols"] = [{ wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, "Mã vòng tay");

    // Generate and download file
    XLSX.writeFile(wb, "mau-ma-vong-tay.xlsx");

    toast({
      variant: "success",
      title: "Thành công",
      description: "Đã tải file mẫu",
    });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      // Read file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // Parse codes (skip header row)
      const codeList = jsonData
        .slice(1)
        .map((row) => row[0]?.toString().trim())
        .filter((code) => code && code.length > 0);

      if (codeList.length === 0) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "File không chứa mã hợp lệ nào",
        });
        setLoading(false);
        return;
      }

      // Check which codes already exist in database
      const { data: existingCodes } = await supabase
        .from("bracelet_codes")
        .select("code")
        .in("code", codeList);

      // Create Set for fast lookup
      const existingCodeSet = new Set(
        existingCodes?.map((item) => item.code) || []
      );

      // Filter out duplicates - only keep codes not in database
      const newCodes = codeList.filter((code) => !existingCodeSet.has(code));
      const duplicateCount = codeList.length - newCodes.length;

      // If no new codes, show message and return
      if (newCodes.length === 0) {
        toast({
          variant: "destructive",
          title: "Không có mã mới",
          description: `Tất cả ${duplicateCount} mã đã tồn tại trong hệ thống`,
        });
        setLoading(false);
        e.target.value = "";
        return;
      }

      // Insert new codes into database
      const { data: insertedData, error: insertError } = await supabase
        .from("bracelet_codes")
        .insert(newCodes.map((code) => ({ code })))
        .select();

      if (insertError) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: insertError.message,
        });
      } else if (insertedData) {
        // Update state with new codes
        setCodes([...insertedData, ...codes]);
        setShowAddModal(false);

        // Show success message with summary
        const message =
          duplicateCount > 0
            ? `Đã thêm ${insertedData.length} mã mới, bỏ qua ${duplicateCount} mã trùng`
            : `Đã thêm ${insertedData.length} mã mới`;

        toast({
          variant: "success",
          title: "Thành công",
          description: message,
        });
      }

      // Reset file input
      e.target.value = "";
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể đọc file Excel",
      });
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from("bracelet_codes").delete().eq("id", deleteId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } else {
      setCodes(codes.filter((c) => c.id !== deleteId));
      toast({
        variant: "success",
        title: "Thành công",
        description: "Đã xóa mã vòng tay",
      });
    }
    setDeleteId(null);
  };

  const handleToggleActivation = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("bracelet_codes")
      .update({
        is_activated: !currentStatus,
        activated_at: !currentStatus ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } else {
      setCodes(
        codes.map((c) =>
          c.id === id
            ? {
                ...c,
                is_activated: !currentStatus,
                activated_at: !currentStatus ? new Date().toISOString() : null,
              }
            : c
        )
      );
      toast({
        variant: "success",
        title: "Thành công",
        description: !currentStatus ? "Đã kích hoạt mã" : "Đã hủy kích hoạt mã",
      });
    }
  };

  const handleActivateAll = async () => {
    const inactiveCodes = codes.filter((c) => !c.is_activated);
    if (inactiveCodes.length === 0) return;

    setActivatingAll(true);

    const { error } = await supabase
      .from("bracelet_codes")
      .update({
        is_activated: true,
        activated_at: new Date().toISOString(),
      })
      .eq("is_activated", false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } else {
      setCodes(
        codes.map((c) => ({
          ...c,
          is_activated: true,
          activated_at: new Date().toISOString(),
        }))
      );
      toast({
        variant: "success",
        title: "Thành công",
        description: `Đã kích hoạt ${inactiveCodes.length} mã vòng tay`,
      });
    }

    setActivatingAll(false);
    setShowActivateAllDialog(false);
  };

  const handleDeactivateAll = async () => {
    const activatedCodes = codes.filter((c) => c.is_activated);
    if (activatedCodes.length === 0) return;

    setDeactivatingAll(true);

    const { error } = await supabase
      .from("bracelet_codes")
      .update({
        is_activated: false,
        activated_at: null,
      })
      .eq("is_activated", true);

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } else {
      setCodes(
        codes.map((c) => ({
          ...c,
          is_activated: false,
          activated_at: null,
        }))
      );
      toast({
        variant: "success",
        title: "Thành công",
        description: `Đã hủy kích hoạt ${activatedCodes.length} mã vòng tay`,
      });
    }

    setDeactivatingAll(false);
    setShowDeactivateAllDialog(false);
  };

  const handleDeleteAll = async () => {
    if (codes.length === 0) return;

    setDeletingAll(true);

    const { error } = await supabase
      .from("bracelet_codes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (dummy condition that always matches)

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } else {
      const deletedCount = codes.length;
      setCodes([]);
      toast({
        variant: "success",
        title: "Thành công",
        description: `Đã xóa ${deletedCount} mã vòng tay`,
      });
    }

    setDeletingAll(false);
    setShowDeleteAllDialog(false);
  };

  const filteredCodes = codes.filter((code) => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "activated" && code.is_activated) ||
      (filterStatus === "not_activated" && !code.is_activated);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <>
      {/* Toolbar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="activated">Đã kích hoạt</SelectItem>
                <SelectItem value="not_activated">Chưa kích hoạt</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm mã mới
            </Button>

            {codes.some((c) => !c.is_activated) && (
              <Button
                variant="default"
                onClick={() => setShowActivateAllDialog(true)}
              >
                <Power className="h-4 w-4 mr-2" />
                Kích hoạt tất cả
              </Button>
            )}

            {codes.some((c) => c.is_activated) && (
              <Button
                variant="destructive"
                onClick={() => setShowDeactivateAllDialog(true)}
              >
                <PowerOff className="h-4 w-4 mr-2" />
                Hủy kích hoạt tất cả
              </Button>
            )}

            {codes.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteAllDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa tất cả
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày kích hoạt</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-medium">{code.code}</TableCell>
                  <TableCell>
                    <Badge variant={code.is_activated ? "success" : "secondary"}>
                      {code.is_activated ? "Đã kích hoạt" : "Chưa kích hoạt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(code.activated_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(code.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActivation(code.id, code.is_activated)}
                      >
                        {code.is_activated ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-1" />
                            Hủy
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-1" />
                            Kích hoạt
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(code.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="px-4 py-3 border-t text-sm text-muted-foreground">
          Hiển thị {filteredCodes.length} / {codes.length} mã
        </div>
      </Card>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import mã vòng tay từ Excel</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1: Download Template */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  1
                </div>
                <div className="space-y-2 flex-1">
                  <Label className="text-base font-semibold">Tải file mẫu</Label>
                  <p className="text-sm text-muted-foreground">
                    Tải file Excel mẫu, điền các mã vòng tay vào cột đầu tiên
                  </p>
                  <Button
                    onClick={handleExportTemplate}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Tải file mẫu (.xlsx)
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Step 2: Upload File */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  2
                </div>
                <div className="space-y-2 flex-1">
                  <Label className="text-base font-semibold">Upload file Excel</Label>
                  <p className="text-sm text-muted-foreground">
                    Chọn file Excel đã điền dữ liệu để import vào hệ thống
                  </p>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportExcel}
                      disabled={loading}
                      className="cursor-pointer"
                    />
                  </div>
                  {loading && (
                    <p className="text-sm text-primary font-medium">
                      Đang xử lý file...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddModal(false)} disabled={loading}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa mã vòng tay này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate All Confirmation */}
      <AlertDialog open={showActivateAllDialog} onOpenChange={setShowActivateAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận kích hoạt tất cả</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn kích hoạt TẤT CẢ {codes.filter((c) => !c.is_activated).length} mã vòng tay chưa kích hoạt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={activatingAll}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateAll}
              disabled={activatingAll}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {activatingAll ? "Đang xử lý..." : "Kích hoạt tất cả"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate All Confirmation */}
      <AlertDialog open={showDeactivateAllDialog} onOpenChange={setShowDeactivateAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy kích hoạt tất cả</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy kích hoạt TẤT CẢ {codes.filter((c) => c.is_activated).length} mã vòng tay đang kích hoạt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivatingAll}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateAll}
              disabled={deactivatingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivatingAll ? "Đang xử lý..." : "Hủy kích hoạt tất cả"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tất cả</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa TẤT CẢ {codes.length} mã vòng tay? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn toàn bộ dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAll}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAll ? "Đang xóa..." : "Xóa tất cả"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
