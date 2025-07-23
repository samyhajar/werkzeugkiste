import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/shared/ConditionalLayout";

const assistant = Assistant({
  variable: '--font-assistant',
  subsets: ['latin'],
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: "Werkzeugkiste",
  description: "Learning Platform",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={assistant.variable} suppressHydrationWarning>
      <body
        className={`${assistant.variable} antialiased`}
      >
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
