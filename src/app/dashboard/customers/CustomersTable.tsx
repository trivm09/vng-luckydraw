"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Search, Trash2, Pencil } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  bracelet_code: string;
  has_existing_code: boolean;
  created_at: string;
  has_won: boolean;
  prize_name: string | null;
  won_at: string | null;
}

interface Props {
  initialCustomers: Customer[];
}

export default function CustomersTable({ initialCustomers }: Props) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWon, setFilterWon] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bracelet_code: "",
    has_existing_code: false,
    has_won: false,
    prize_name: "",
  });

  const { toast } = useToast();
  const supabase = createClient();

  // Validate số điện thoại 10 số
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      bracelet_code: "",
      has_existing_code: false,
      has_won: false,
      prize_name: "",
    });
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        variant: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên và số điện thoại",
      });
      return;
    }

    if (!isValidPhone(formData.phone)) {
      toast({
        variant: "warning",
        title: "Số điện thoại không hợp lệ",
        description: "Số điện thoại phải có đúng 10 chữ số",
      });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        bracelet_code: formData.bracelet_code.trim(),
        has_existing_code: formData.has_existing_code,
        has_won: formData.has_won,
        prize_name: formData.has_won ? formData.prize_name.trim() || null : null,
        won_at: formData.has_won ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } else if (data) {
      setCustomers([data, ...customers]);
      resetForm();
      setShowAddModal(false);
      toast({
        variant: "success",
        title: "Thành công",
        description: "Đã thêm khách hàng mới",
      });
    }
    setLoading(false);
  };

  const handleEdit = async () => {
    if (!editingCustomer) return;

    if (!isValidPhone(formData.phone)) {
      toast({
        variant: "warning",
        title: "Số điện thoại không hợp lệ",
        description: "Số điện thoại phải có đúng 10 chữ số",
      });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .update({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        bracelet_code: formData.bracelet_code.trim(),
        has_existing_code: formData.has_existing_code,
        has_won: formData.has_won,
        prize_name: formData.has_won ? formData.prize_name.trim() || null : null,
        won_at: formData.has_won && !editingCustomer.has_won ? new Date().toISOString() : editingCustomer.won_at,
      })
      .eq("id", editingCustomer.id)
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } else if (data) {
      setCustomers(customers.map((c) => (c.id === data.id ? data : c)));
      setEditingCustomer(null);
      resetForm();
      setShowEditModal(false);
      toast({
        variant: "success",
        title: "Thành công",
        description: "Đã cập nhật thông tin khách hàng",
      });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    // Thử xóa và lấy data để kiểm tra
    const { data, error, count } = await supabase
      .from("customers")
      .delete()
      .eq("id", deleteId)
      .select();

    if (error) {
      toast({
        variant: "destructive",
        title: "Lỗi xóa",
        description: error.message,
      });
      setDeleteId(null);
      return;
    }

    // Kiểm tra xem có thực sự xóa được không
    if (!data || data.length === 0) {
      toast({
        variant: "destructive",
        title: "Không thể xóa",
        description: "Bạn không có quyền xóa dữ liệu này. Vui lòng kiểm tra RLS policy trong Supabase.",
      });
      setDeleteId(null);
      return;
    }

    // Xóa thành công
    setCustomers((prev) => prev.filter((c) => c.id !== deleteId));
    toast({
      variant: "success",
      title: "Thành công",
      description: "Đã xóa khách hàng",
    });
    setDeleteId(null);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      bracelet_code: customer.bracelet_code,
      has_existing_code: customer.has_existing_code,
      has_won: customer.has_won,
      prize_name: customer.prize_name || "",
    });
    setShowEditModal(true);
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.bracelet_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterWon === "all" ||
      (filterWon === "won" && customer.has_won) ||
      (filterWon === "not_won" && !customer.has_won);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const CustomerForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên khách hàng *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nhập tên khách hàng"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Số điện thoại *</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={formData.phone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 10);
            setFormData({ ...formData, phone: value });
          }}
          placeholder="Nhập số điện thoại (10 số)"
          maxLength={10}
        />
        {formData.phone && formData.phone.length < 10 && (
          <p className="text-xs text-muted-foreground">{formData.phone.length}/10 số</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bracelet_code">Mã vòng tay</Label>
        <Input
          id="bracelet_code"
          value={formData.bracelet_code}
          onChange={(e) => setFormData({ ...formData, bracelet_code: e.target.value })}
          placeholder="Nhập mã vòng tay"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="has_existing_code"
          checked={formData.has_existing_code}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, has_existing_code: checked as boolean })
          }
        />
        <Label htmlFor="has_existing_code" className="font-normal">
          Có mã từ trước
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="has_won"
          checked={formData.has_won}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, has_won: checked as boolean })
          }
        />
        <Label htmlFor="has_won" className="font-normal">
          Đã trúng thưởng
        </Label>
      </div>

      {formData.has_won && (
        <div className="space-y-2">
          <Label htmlFor="prize_name">Tên giải thưởng</Label>
          <Input
            id="prize_name"
            value={formData.prize_name}
            onChange={(e) => setFormData({ ...formData, prize_name: e.target.value })}
            placeholder="Nhập tên giải thưởng"
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Toolbar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, SĐT, mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterWon} onValueChange={setFilterWon}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="won">Đã trúng thưởng</SelectItem>
                <SelectItem value="not_won">Chưa trúng thưởng</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm khách hàng
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Mã vòng tay</TableHead>
              <TableHead>Trúng thưởng</TableHead>
              <TableHead>Giải thưởng</TableHead>
              <TableHead>Ngày tham gia</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium">{customer.name}</div>
                    {customer.has_existing_code && (
                      <span className="text-xs text-muted-foreground">Có mã từ trước</span>
                    )}
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="font-mono">{customer.bracelet_code || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={customer.has_won ? "warning" : "secondary"}>
                      {customer.has_won ? "Đã trúng" : "Chưa trúng"}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.prize_name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(customer.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(customer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(customer.id)}
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
          Hiển thị {filteredCustomers.length} / {customers.length} khách hàng
        </div>
      </Card>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm khách hàng</DialogTitle>
          </DialogHeader>
          <CustomerForm />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleAdd} disabled={loading}>
              {loading ? "Đang xử lý..." : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
          </DialogHeader>
          <CustomerForm />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
                setEditingCustomer(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Đang xử lý..." : "Cập nhật"}
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
              Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.
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
