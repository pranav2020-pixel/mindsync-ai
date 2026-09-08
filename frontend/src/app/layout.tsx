import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MindSync AI - Mental Wellness & Productivity",
  description: "AI-powered mental wellness and productivity platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="flex-1 p-6 overflow-auto">
                  {children}
                </main>
              </div>
            </div>
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
