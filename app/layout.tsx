import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SAKAN AI | Housing Loan Rescheduling",
  description: "AI Decision Agent for MOEI / Sheikh Zayed Housing Programme housing loan arrears rescheduling.",
};

import { DemoNav } from "@/components/demo-nav";
import { DemoProvider } from "@/lib/demo-context";
import { DemoSelector } from "@/components/DemoSelector";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className} dir="ltr">
      <body className="min-h-screen bg-sakan-bg text-sakan-text font-sans antialiased">
        <DemoProvider>
          {children}
          <DemoNav />
          <DemoSelector />
        </DemoProvider>
      </body>
    </html>
  );
}
