import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ASK THE CHURCH",
  description: "The professional standard for ecclesiastical dialogue.",
  metadataBase: new URL("https://asktc.vercel.app"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "ASK THE CHURCH",
    description: "Intelligence in every inquiry.",
    type: "website",
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  themeColor: "#f7f4ef",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="antialiased overflow-x-hidden" style={{ background: "#f7f4ef", color: "#1a1410", fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1a1410",
              color: "#f7f4ef",
              borderRadius: "2px",
              border: "1px solid rgba(200,169,110,0.4)",
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.1em",
              padding: "12px 20px",
              textTransform: "uppercase",
            },
          }}
        />
        <div className="relative flex flex-col min-h-screen">{children}</div>
      </body>
    </html>
  );
}
