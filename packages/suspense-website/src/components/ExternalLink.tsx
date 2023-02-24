import { PropsWithChildren } from "react";

export function ExternalLink({
  children,
  className = "",
  to,
}: PropsWithChildren & { className?: string; to: string }) {
  return (
    <a
      className={className}
      href={to}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}
