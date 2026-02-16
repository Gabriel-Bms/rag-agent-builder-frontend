import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Liquid Premium RAG Workspace",
  description: "Elite Architectural RAG Strategic Intelligence Console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${jakartaSans.variable} antialiased min-h-screen selection:bg-[var(--nvidia-green)] selection:text-white relative flex flex-col`}
      >


        <Navigation />

        <main className="flex-1 flex flex-col relative z-10 w-full max-w-[1400px] mx-auto px-4 pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
