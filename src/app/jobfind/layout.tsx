import type { Metadata } from "next";
import { JobFindNavbar } from "@/components/jobfind/navbar";

export const metadata: Metadata = {
  title: "JobFind — Eric Li",
  description:
    "Track job applications and extract insights from job descriptions.",
};

export default function JobFindLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <JobFindNavbar />
      <main className="mx-auto max-w-6xl px-6 py-10 md:py-12">{children}</main>
    </div>
  );
}
