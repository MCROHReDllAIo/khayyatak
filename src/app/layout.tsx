import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/context/app-context";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

import { BRAND, brandTitle } from "@/lib/constants/brand";

export const metadata: Metadata = {
  title: brandTitle("ar"),
  description: `${BRAND.taglineAr} ${BRAND.descriptionAr}`,
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} ${inter.variable} font-arabic antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
