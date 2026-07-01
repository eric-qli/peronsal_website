import { siteConfig } from "@/lib/data";

export function Footer() {
  return (
    <footer className="border-t border-indigo-400/20 bg-card/40 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <p className="text-base text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <p className="text-base text-muted-foreground">
          Built with Next.js, Tailwind CSS & Framer Motion
        </p>
      </div>
    </footer>
  );
}
