import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@/styles.css";

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='5' fill='%23dc2626'/%3E%3Ctext x='16' y='23' font-family='Georgia%2C serif' font-size='15' font-weight='bold' fill='white' text-anchor='middle'%3EBP%3C/text%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "Bharat Pulse",
  description: "Without fear and without favour.",
  authors: [{ name: "Bharat Pulse" }],
  openGraph: {
    title: "Bharat Pulse",
    description: "Without fear and without favour.",
    type: "website",
  },
  twitter: { card: "summary" },
  icons: { icon: FAVICON },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
