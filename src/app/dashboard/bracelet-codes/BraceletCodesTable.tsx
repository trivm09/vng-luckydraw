"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, Trash2, Power, PowerOff } from "lucide-react";

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
  const [newCode, setNewCode] = useState("");
  const [bulkCodes, setBulkCodes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { toast } = useToast();
  const supabase = createClient();

  const handleAddCode = async () => {
    if (!newCode.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("bracelet_codes")
      .insert({ code: newCode.trim() })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } else if (data) {
      setCodes([data, ...codes]);
      setNewCode("");
      setShowAddModal(false);
      toast({
        variant: "success",
        title: "Thành công",
        description: "Đã thêm mã vòng tay mới",
      });
    }
    setLoading(false);
  };

  const handleBulkAdd = async () => {
    const codeList = bulkCodes
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (codeList.length === 0) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("bracelet_codes")
      .insert(codeList.map((code) => ({ code })))
      .select();

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } else if (data) {
      setCodes([...data, ...codes]);
      setBulkCodes("");
      setShowAddModal(false);
      toast({
        variant: "success",
        title: "Thành công",
        description: `Đã thêm ${data.length} mã vòng tay`,
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
            <DialogTitle>Thêm mã vòng tay</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Thêm một mã</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Nhập mã vòng tay"
              />
              <Button
                onClick={handleAddCode}
                disabled={loading || !newCode.trim()}
                className="w-full"
              >
                {loading ? "Đang thêm..." : "Thêm mã"}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">hoặc</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thêm nhiều mã (mỗi mã một dòng)</Label>
              <Textarea
                value={bulkCodes}
                onChange={(e) => setBulkCodes(e.target.value)}
                placeholder={"CODE001\nCODE002\nCODE003"}
                rows={5}
                className="font-mono"
              />
              <Button
                onClick={handleBulkAdd}
                disabled={loading || !bulkCodes.trim()}
                variant="secondary"
                className="w-full"
              >
                {loading ? "Đang thêm..." : "Thêm hàng loạt"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
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
    </>
  );
}
