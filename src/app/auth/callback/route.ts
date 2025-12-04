import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Validate redirect URL để tránh open redirect vulnerability
const isValidRedirectPath = (path: string): boolean => {
  // Phải bắt đầu bằng / và không có // (tránh //evil.com)
  // Không cho phép protocol (http:, javascript:, etc.)
  return /^\/[^/]/.test(path) && !path.includes(":");
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Validate redirect path
  const redirectPath = isValidRedirectPath(next) ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Nếu có lỗi, redirect về trang login với thông báo
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
