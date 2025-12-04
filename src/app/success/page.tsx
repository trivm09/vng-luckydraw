"use client";

import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Suspense } from "react";

// Sanitize string để tránh XSS
const sanitizeString = (str: string, maxLength: number = 100): string => {
  return str
    .slice(0, maxLength)
    .replace(/[<>\"'&]/g, "") // Remove potential XSS characters
    .trim();
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const code = sanitizeString(searchParams.get("code") || "", 20);
  const name = sanitizeString(searchParams.get("name") || "", 100);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Đăng ký thành công!
          </CardTitle>
          <CardDescription>
            Chúc mừng{" "}
            {name ? <span className="font-semibold">{name}</span> : "bạn"} đã
            đăng ký tham gia chương trình
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-dashed border-purple-200">
            <p className="text-sm text-muted-foreground mb-2">
              Mã số may mắn của bạn
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-bold tracking-widest text-purple-600">
                {code}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg text-left">
            <PartyPopper className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Lưu ý quan trọng</p>
              <p className="text-amber-700 mt-1">
                Vui lòng ghi nhớ hoặc chụp ảnh mã số này. Bạn sẽ cần mã này để
                nhận giải thưởng nếu trúng thưởng.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Kết quả quay số sẽ được công bố tại sự kiện. Chúc bạn may mắn!
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Quay lại trang chủ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500">
          <Card className="w-full max-w-md text-center p-8">
            <div className="animate-pulse">Đang tải...</div>
          </Card>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
