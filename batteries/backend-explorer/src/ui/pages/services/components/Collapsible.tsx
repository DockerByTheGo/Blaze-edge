import type { CSSProperties, ReactNode } from "react";

type CollapsibleProps = {
  children: ReactNode;
  contentStyle?: CSSProperties;
  defaultOpen?: boolean;
  meta?: ReactNode;
  style?: CSSProperties;
  summaryStyle?: CSSProperties;
  title: ReactNode;
};

const styles: Record<string, CSSProperties> = {
  summary: {
    cursor: "pointer",
    fontWeight: 500,
    listStyle: "none",
    padding: "12px 16px",
  },
  heading: {
    alignItems: "center",
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
  },
  content: {
    borderTop: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 16,
  },
  meta: {
    background: "#1e293b",
    borderRadius: 999,
    color: "#cbd5e1",
    fontSize: 12,
    padding: "4px 8px",
  },
};

export function Collapsible({
  children,
  contentStyle,
  defaultOpen = false,
  meta,
  style,
  summaryStyle,
  title,
}: CollapsibleProps) {
  return (
    <details style={style} open={defaultOpen}>
      <summary style={{ ...styles.summary, ...summaryStyle }}>
        <div style={styles.heading}>
          <span>{title}</span>
          {meta && <span style={styles.meta}>{meta}</span>}
        </div>
      </summary>

      <div style={{ ...styles.content, ...contentStyle }}>{children}</div>
    </details>
  );
}
