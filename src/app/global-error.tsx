"use client";

/**
 * Root layout dışında kalan hatalar (layout.tsx, html, vb.)
 * Kendi html/body ile render edilir — global.css burada yok; sade stil.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0f172a",
          color: "#f1f5f9",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: 12 }}>Closer CRM — kritik hata</h1>
          <p style={{ fontSize: "0.875rem", opacity: 0.85, marginBottom: 16 }}>
            Uygulama iskeleti yüklenemedi. Terminalde hata çıktısına bak; ardından{" "}
            <code style={{ background: "#334155", padding: "2px 6px", borderRadius: 4 }}>
              npm run fresh && npm run dev
            </code>{" "}
            dene.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <pre
              style={{
                textAlign: "left",
                fontSize: 11,
                overflow: "auto",
                maxHeight: 160,
                padding: 12,
                background: "#020617",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#059669",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
