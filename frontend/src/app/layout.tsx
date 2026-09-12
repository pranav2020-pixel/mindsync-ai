import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PwaInstaller } from "@/components/pwa-installer";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MindSync AI - Mental Wellness & Productivity",
  description: "AI-powered mental wellness and productivity platform for iOS, Android, and Desktop",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MindSync AI",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MindSync AI" />
        <meta name="application-name" content="MindSync AI" />
        <meta name="theme-color" content="#090d16" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-24 lg:pb-8 overflow-auto min-w-0">
                  {children}
                </main>
              </div>
            </div>
            <BottomNav />
            <PwaInstaller />
            <Toaster position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
