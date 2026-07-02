import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FRAME — UI Builder",
    template: "%s · FRAME",
  },
  description: "A drag-and-drop UI builder for SvelteKit + shadcn/svelte.",
  applicationName: "FRAME",
  keywords: ["FRAME", "UI Builder", "SvelteKit", "shadcn/svelte", "drag-and-drop", "code generation"],
  authors: [{ name: "FRAME" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "FRAME — UI Builder",
    description: "A drag-and-drop UI builder for SvelteKit + shadcn/svelte.",
    siteName: "FRAME",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FRAME — UI Builder",
    description: "A drag-and-drop UI builder for SvelteKit + shadcn/svelte.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
