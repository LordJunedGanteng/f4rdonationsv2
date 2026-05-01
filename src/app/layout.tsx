import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "F4R Donations Service's",
  description: "Roblox Donation Integration Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} dark`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-surface text-on-surface min-h-dvh pb-24">
        {/* Ambient background glows */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] rounded-full blur-[120px]" style={{ background: "rgba(174,198,255,0.07)" }} />
          <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] rounded-full blur-[120px]" style={{ background: "rgba(210,187,255,0.06)" }} />
        </div>

        <AppHeader />

        <main className="pt-20">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  );
}
