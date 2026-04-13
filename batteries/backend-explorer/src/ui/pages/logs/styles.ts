import type { CSSProperties } from "hono/jsx";

export const styles: Record<string, CSSProperties> = {
  page: {
    background: "#020617",
    boxSizing: "border-box",
    color: "#f1f5f9",
    minHeight: "100vh",
    padding: "32px 24px",
  },
  shell: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    margin: "0 auto",
    maxWidth: 1152,
    width: "100%",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  eyebrow: {
    color: "#7dd3fc",
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  titleRow: {
    alignItems: "flex-end",
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: 600,
    margin: 0,
  },
  description: {
    color: "#94a3b8",
    fontSize: 14,
    margin: "8px 0 0",
  },
  count: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#cbd5e1",
    fontSize: 14,
    padding: "8px 12px",
  },
  status: {
    color: "#64748b",
    fontSize: 12,
  },
};
