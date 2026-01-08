import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { BottomNav } from "@/components/BottomNav"; 
import DesktopHeader from "@/components/DesktopHeader"; // 1. Import the header
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Updated Metadata: Clean and Mature
export const metadata: Metadata = {
  title: "ASKTC",
  description: "Direct Access to Leadership Guidance",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '12px', // Mature radius
              padding: '16px 24px',
              fontSize: '12px',
              fontWeight: '800',
              textTransform: 'uppercase',
            },
          }}
        />
        
        {/* 2. Desktop Header: Only shows on screens > 768px */}
        <DesktopHeader />

        {/* The Main Content Area */}
        {children}

        {/* 3. Bottom Navigation: Only shows on mobile screens < 768px */}
        <BottomNav userId={session?.user?.id} />
      </body>
    </html>
  );
}