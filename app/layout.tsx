import type { Metadata } from "next";
import { Cabin } from "next/font/google";
import "./globals.css";

const cabin = Cabin({
  variable: "--font-cabin",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interior Design Generator",
  description: "Create stunning interior designs using AI with Gemini",
  keywords: ["interior design", "AI", "Gemini", "design generator"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cabin.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
