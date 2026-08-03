import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "USAA — Insurance, Banking & Investment Services",
    template: "%s | USAA",
  },
  description:
    "A functional demonstration of a USAA-style banking experience. Not affiliated with USAA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}