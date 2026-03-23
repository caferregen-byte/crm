import Link from "next/link";
import { NewLeadToast } from "./new-lead-toast";
import { ThemeToggle } from "./theme-toggle";
import { TopBarStats } from "./top-bar-stats";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-10 border-b border-[var(--apple-border)] bg-[var(--apple-surface)]/92 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[var(--apple-surface)]/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <Link
            href="/"
            className="text-[17px] font-semibold tracking-tight text-[var(--foreground)] transition hover:opacity-80"
          >
            Closer
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-8">
            <TopBarStats />
            <nav className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <NavLink href="/">Panel</NavLink>
              <NavLink href="/pipeline">Pipeline</NavLink>
              <NavLink href="/leads">Leadler</NavLink>
              <NavLink href="/leads/new">Ekle</NavLink>
              <NavLink href="/wufoo">Wufoo</NavLink>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">{children}</main>
      <NewLeadToast />
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-[13px] text-[var(--muted)] transition hover:bg-black/[0.04] hover:text-[var(--foreground)] hover:scale-[1.02] active:scale-[0.98] dark:hover:bg-white/[0.06]"
    >
      {children}
    </Link>
  );
}
