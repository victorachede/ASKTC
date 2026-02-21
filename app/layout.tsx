import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

// Configured Inter to be the primary variable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'], // Added full weight range for that "World Class" look
});

export const metadata: Metadata = {
  title: "ASK THE CHURCH",
  description: "The professional standard for ecclesiastical dialogue.",
  metadataBase: new URL('https://asktc.vercel.app'),
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
  themeColor: "#0a0a0a", // Updated to match your new Dark UI
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
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      {/* 1. font-sans now points to Inter via Tailwind config 
          2. bg-[#0a0a0a] ensures no "white flash" on load
      */}
      <body className="font-sans antialiased bg-[#0a0a0a] text-white overflow-x-hidden">
        
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a1a',
              color: '#FFFFFF',
              borderRadius: '12px', // Matches your new rounded UI
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.02em',
              padding: '12px 20px',
              backdropFilter: 'blur(10px)',
            },
          }}
        />

        <div className="relative flex flex-col min-h-screen">
          {children}
        </div>

      </body>
    </html>
  );
}