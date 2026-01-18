import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatchUp Pro | 매치업 프로",
  description: "경기를 관리하면, 동호회가 굴러갑니다. 테니스 경기 기록·랭킹·운영 관리 앱",
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
