const DB_TIMEOUT_MS = 10_000;

/**
 * Sunucu bileşenlerinde Prisma hatasını yakalayıp genel 500 yerine anlamlı UI döndürmek için.
 * DB yanıt vermezse timeout ile sayfa sonsuza kadar takılmaz.
 */
export async function runPrisma<T>(
  fn: () => Promise<T>
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Veritabanı yanıt vermedi (10 sn)")),
        DB_TIMEOUT_MS
      );
    });
    const data = await Promise.race([fn(), timeoutPromise]).finally(() =>
      clearTimeout(timeoutId!)
    );
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}
