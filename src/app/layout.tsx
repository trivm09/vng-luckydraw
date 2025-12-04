import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Lucky Draw - VNG",
  description: "Hệ thống quay số trúng thưởng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
