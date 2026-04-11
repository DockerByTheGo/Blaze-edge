import type { ReactNode } from "react";

type CollapsibleProps = {
  children: ReactNode;
  className: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  meta?: ReactNode;
  summaryClassName?: string;
  title: ReactNode;
};

export function Collapsible({
  children,
  className,
  contentClassName = "collapsible-content",
  defaultOpen = false,
  meta,
  summaryClassName = "collapsible-summary",
  title,
}: CollapsibleProps) {
  return (
    <details className={className} open={defaultOpen}>
      <summary className={summaryClassName}>
        <div className="collapsible-heading">
          <span>{title}</span>
          {meta && <span className="collapsible-meta">{meta}</span>}
        </div>
      </summary>

      <div className={contentClassName}>{children}</div>
    </details>
  );
}
