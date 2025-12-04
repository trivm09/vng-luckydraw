"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Handle code from URL (when Supabase redirects here instead of /auth/callback)
  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setMessage({ type: "error", text: "Đăng nhập thất bại. Vui lòng thử lại." });
      return;
    }

    if (code) {
      setLoading(true);
      setMessage({ type: "success", text: "Đang xác thực..." });

      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setMessage({ type: "error", text: "Đăng nhập thất bại: " + error.message });
          setLoading(false);
        } else {
          router.push("/dashboard");
        }
      });
    }
  }, [searchParams, supabase.auth, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Kiểm tra email của bạn để nhận link đăng nhập!",
      });
      setEmail("");
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Đăng nhập</h1>
          <p className="text-gray-500 text-center mb-6">
            Nhập email để nhận Magic Link
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Đang gửi..." : "Gửi Magic Link"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center p-6">
          <div className="animate-pulse">Đang tải...</div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
