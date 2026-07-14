import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import { CelestialSphere } from "@/components/GalaxyKit";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Orderflow trade recaps with the Label Rule",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="galaxy-bg" aria-hidden="true">
          <CelestialSphere />
        </div>
        {children}
      </body>
    </html>
  );
}
