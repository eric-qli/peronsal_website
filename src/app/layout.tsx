import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eric Li — Software Engineer",
  description:
    "Computer Science and Statistics student at the University of Toronto with experience in data engineering, full-stack development, and AI-powered application tooling.",
  keywords: [
    "Eric Li",
    "Software Engineer",
    "Computer Science",
    "Statistics",
    "University of Toronto",
    "Data Engineering",
    "Full-Stack Development",
    "Portfolio",
  ],
  authors: [{ name: "Eric Li" }],
  openGraph: {
    title: "Eric Li — Software Engineer",
    description:
      "Computer Science and Statistics student at the University of Toronto with experience in data engineering, full-stack development, and AI-powered application tooling.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans text-foreground selection:bg-primary/30 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}
