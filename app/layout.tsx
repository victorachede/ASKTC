import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ASK THE CHURCH",
  description: "The professional standard for ecclesiastical dialogue.",
  metadataBase: new URL('https://askthechurch.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "ASK THE CHURCH",
    description: "Intelligence in every inquiry.",
    type: "website",
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Essential for high-end mobile UX
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-white text-[#1D1D1F]`}>
        
        {/* RAW TOAST NOTIFICATIONS */}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1D1D1F',
              color: '#FFFFFF',
              borderRadius: '0px', 
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              padding: '12px 24px',
            },
          }}
        />

        {/* CONTENT STACK */}
        <div className="relative flex flex-col min-h-screen">
          {children}
        </div>

      </body>
    </html>
  );
}