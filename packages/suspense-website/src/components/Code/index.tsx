import { Suspense } from "react";

import { Language } from "../../suspense/SyntaxParsingCache";

import { PlainText } from "./PlainText";
import { SyntaxHighlighted } from "./SyntaxHighlighted";

export default function Code({
  className = "",
  code,
  language = "jsx",
  showLineNumbers = false,
}: {
  className?: string;
  code: string;
  language?: Language;
  showLineNumbers?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <PlainText
          className={className}
          code={code}
          showLineNumbers={showLineNumbers}
        />
      }
    >
      <SyntaxHighlighted
        className={className}
        code={code}
        language={language}
        showLineNumbers={showLineNumbers}
      />
    </Suspense>
  );
}
