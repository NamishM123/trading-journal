import type { Metadata } from "next";
import { GalaxyBackground } from "@/components/GalaxyKit";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="galaxy-bg" aria-hidden="true">
          <GalaxyBackground />
        </div>
        {children}
      </body>
    </html>
  );
}
