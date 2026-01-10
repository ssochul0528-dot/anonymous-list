import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "무명리스트",
  description: "테니스 클럽 운영/스케줄/랭킹 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased text-[#333D4B] bg-[#F2F4F6]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
