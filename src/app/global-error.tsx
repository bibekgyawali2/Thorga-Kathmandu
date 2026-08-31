"use client";

/**
 * Last-resort boundary. This replaces the root layout, so it cannot rely on
 * the app's providers, fonts or token stylesheet and styles itself inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ne">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3f7f3",
          color: "#12211a",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#47574f" }}>
            The application failed to load. Please refresh the page. If the problem continues,
            contact the secretariat at thorgakathmandu@gmail.com.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#47574f" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "12px",
              border: "none",
              background: "#1b5e3f",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
