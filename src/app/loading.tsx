export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
      <p className="text-sm text-zinc-500">Yükleniyor…</p>
    </div>
  );
}
