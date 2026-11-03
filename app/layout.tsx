import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "41-Day English Upgrade | B1 → B2 Challenge",
  description:
    "Intensive single-learner productive skills challenge: 15 minutes Speaking + 15 minutes Writing daily.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("h-full antialiased font-sans", figtree.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-clip">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
