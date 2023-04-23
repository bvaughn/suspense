import { useMemo } from "react";

import { escapeHtmlEntities } from "../../suspense/SyntaxParsingCache";

import styles from "./shared.module.css";

export function PlainText({
  className,
  code,
  showLineNumbers,
}: {
  className: string;
  code: string;
  showLineNumbers: boolean;
}) {
  const htmlLines = useMemo<string[]>(() => {
    return code.split("\n").map((line, index) => {
      const escaped = escapeHtmlEntities(line);

      if (showLineNumbers) {
        return `<span class="${styles.LineNumber}">${
          index + 1
        }</span> ${escaped}`;
      }

      return escaped;
    });
  }, [showLineNumbers, code]);

  const maxLineNumberLength = `${htmlLines.length + 1}`.length;

  return (
    <code
      className={[styles.Code, className].join(" ")}
      dangerouslySetInnerHTML={{ __html: htmlLines.join("<br/>") }}
      style={{
        // @ts-ignore
        "--max-line-number-length": `${maxLineNumberLength}ch`,
      }}
    />
  );
}
