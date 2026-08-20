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
import { SITE, getSiteOrigin } from "@/lib/constants/site";

export const metadata: Metadata = {
  metadataBase: getSiteOrigin(),
  title: brandTitle("ar"),
  description: `${BRAND.taglineAr} ${BRAND.descriptionAr}`,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: brandTitle("ar"),
    description: BRAND.taglineAr,
    url: SITE.productionUrl,
    siteName: BRAND.nameAr,
    locale: "ar_OM",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: brandTitle("ar"),
    description: BRAND.taglineAr,
  },
  alternates: {
    canonical: "/",
  },
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
