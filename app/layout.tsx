import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import { Inter, Outfit } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "MatchUp Pro | 매치업 프로",
  description: "경기를 관리하면, 동호회가 굴러갑니다. 테니스 경기 기록·랭킹·운영 관리 앱",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased text-white bg-[#0A0E17] selection:bg-[#CCFF00] selection:text-[#0A0E17]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
