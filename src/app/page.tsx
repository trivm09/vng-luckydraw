"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Gift, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasBracelet, setHasBracelet] = useState<string>("yes");
  const [braceletCode, setBraceletCode] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Tạo mã 6 số ngẫu nhiên
  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Validate số điện thoại 10 số
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  // Chỉ cho phép nhập số
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        variant: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập họ tên",
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        variant: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập số điện thoại",
      });
      return;
    }

    if (!isValidPhone(phone)) {
      toast({
        variant: "warning",
        title: "Số điện thoại không hợp lệ",
        description: "Số điện thoại phải có đúng 10 chữ số",
      });
      return;
    }

    if (hasBracelet === "yes" && !braceletCode.trim()) {
      toast({
        variant: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập mã vòng tay",
      });
      return;
    }

    setLoading(true);

    try {
      // Kiểm tra số điện thoại đã đăng ký chưa (kiểm tra TRƯỚC để không nuốt mã vòng tay)
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone.trim())
        .maybeSingle();

      if (existingCustomer) {
        toast({
          variant: "destructive",
          title: "Đã đăng ký",
          description: "Số điện thoại này đã được đăng ký trước đó",
        });
        setLoading(false);
        return;
      }

      let finalCode = braceletCode.trim();
      let hasExistingCode = hasBracelet === "yes";
      let braceletCodeId: string | null = null;

      // Nếu không có vòng tay, tạo mã ngẫu nhiên
      if (hasBracelet === "no") {
        // Tạo mã và kiểm tra trùng lặp (giới hạn 100 lần thử)
        let isUnique = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 100;

        while (!isUnique && attempts < MAX_ATTEMPTS) {
          finalCode = generateRandomCode();
          const { data: existing } = await supabase
            .from("customers")
            .select("id")
            .eq("bracelet_code", finalCode)
            .maybeSingle();

          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể tạo mã độc nhất, vui lòng thử lại",
          });
          setLoading(false);
          return;
        }
        hasExistingCode = false;
      } else {
        // Kiểm tra mã vòng tay có tồn tại trong hệ thống không
        const { data: existingCode } = await supabase
          .from("bracelet_codes")
          .select("id, is_activated")
          .eq("code", finalCode)
          .maybeSingle();

        if (!existingCode) {
          toast({
            variant: "destructive",
            title: "Mã không hợp lệ",
            description: "Mã vòng tay không tồn tại trong hệ thống",
          });
          setLoading(false);
          return;
        }

        if (existingCode.is_activated) {
          toast({
            variant: "destructive",
            title: "Mã đã được sử dụng",
            description: "Mã vòng tay này đã được đăng ký trước đó",
          });
          setLoading(false);
          return;
        }

        braceletCodeId = existingCode.id;
      }

      // Tạo khách hàng mới
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          bracelet_code: finalCode,
          has_existing_code: hasExistingCode,
          has_won: false,
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate phone (unique constraint violation)
        if (error.code === "23505") {
          toast({
            variant: "destructive",
            title: "Đã đăng ký",
            description: "Số điện thoại hoặc mã vòng tay đã được sử dụng",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: error.message,
          });
        }
        setLoading(false);
        return;
      }

      // Đánh dấu mã vòng tay đã kích hoạt (chỉ sau khi insert customer thành công)
      if (braceletCodeId) {
        const { error: activateError } = await supabase
          .from("bracelet_codes")
          .update({ is_activated: true, activated_at: new Date().toISOString() })
          .eq("id", braceletCodeId)
          .eq("is_activated", false); // Chỉ update nếu chưa activated (atomic check)

        if (activateError) {
          // Rollback: xóa customer vừa tạo
          await supabase.from("customers").delete().eq("id", data.id);
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể kích hoạt mã vòng tay, vui lòng thử lại",
          });
          setLoading(false);
          return;
        }
      }

      // Chuyển đến trang thành công
      const params = new URLSearchParams({
        code: finalCode,
        name: name.trim(),
      });
      router.push(`/success?${params.toString()}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra, vui lòng thử lại",
      });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Đăng ký tham gia</CardTitle>
          <CardDescription>
            Chương trình quay số trúng thưởng Lucky Draw
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Nhập số điện thoại (10 số)"
                disabled={loading}
                maxLength={10}
              />
              {phone && phone.length < 10 && (
                <p className="text-xs text-muted-foreground">{phone.length}/10 số</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Bạn có vòng tay không?</Label>
              <RadioGroup
                value={hasBracelet}
                onValueChange={setHasBracelet}
                disabled={loading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="font-normal cursor-pointer">
                    Có, tôi có vòng tay
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="font-normal cursor-pointer">
                    Không, tôi chưa có vòng tay
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {hasBracelet === "yes" && (
              <div className="space-y-2">
                <Label htmlFor="braceletCode">Mã vòng tay *</Label>
                <Input
                  id="braceletCode"
                  value={braceletCode}
                  onChange={(e) => setBraceletCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã trên vòng tay"
                  disabled={loading}
                  className="uppercase"
                />
              </div>
            )}

            {hasBracelet === "no" && (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                Hệ thống sẽ tự động tạo một mã số may mắn 6 chữ số cho bạn
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng ký ngay"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
