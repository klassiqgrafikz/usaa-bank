import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "USAA — Insurance, Banking & Investment Services",
    template: "%s | USAA",
  },
  description:
    "Online banking, insurance and investment services for the armed forces community and their families.",
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