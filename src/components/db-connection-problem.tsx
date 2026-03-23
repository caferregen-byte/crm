import Link from "next/link";

/** Prisma / SQLite bağlantısı koptuğunda sunucu bileşenlerinde gösterilir */
export function DbConnectionProblem({ detail }: { detail?: string }) {
  const showTech = process.env.NODE_ENV === "development" && detail;
  return (
    <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-zinc-200/80 bg-white px-8 py-10 dark:border-zinc-800 dark:bg-zinc-900/50">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Veritabanına ulaşılamıyor
      </h1>
      <ol className="list-decimal space-y-2 pl-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <li>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">.env</code>{" "}
          içinde <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">DATABASE_URL</code>
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">npx prisma db push</code>
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">npm run dev</code>
        </li>
      </ol>
      {showTech && (
        <pre className="max-h-40 overflow-auto rounded-xl bg-zinc-950 p-3 text-xs text-zinc-300">
          {detail}
        </pre>
      )}
      <Link
        href="/"
        className="inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Yenile
      </Link>
    </div>
  );
}
