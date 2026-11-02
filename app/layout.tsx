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
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("h-full antialiased font-sans", figtree.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
