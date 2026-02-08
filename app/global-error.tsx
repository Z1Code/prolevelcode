"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ backgroundColor: "#000", color: "#fff", fontFamily: "system-ui", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Algo salio mal</h2>
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1.5rem", backgroundColor: "#333", color: "#fff", border: "1px solid #555", borderRadius: "0.5rem", cursor: "pointer" }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
