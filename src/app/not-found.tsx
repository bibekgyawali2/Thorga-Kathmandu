import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "पृष्ठ फेला परेन | Page not found",
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-ground">
      <div className="max-w-md w-full text-center space-y-5">
        <Compass size={44} weight="duotone" className="text-accent mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-fg">पृष्ठ फेला परेन</h1>
          <p className="text-sm text-muted leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold transition-colors"
          >
            गृहपृष्ठ / Home
          </Link>
          <Link
            href="/#contact"
            className="px-5 py-2.5 rounded-control border border-line bg-surface hover:bg-tint text-fg text-xs font-semibold transition-colors"
          >
            सम्पर्क / Contact
          </Link>
        </div>
      </div>
    </main>
  );
}
