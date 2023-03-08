import { PropsWithChildren } from "react";
import Icon, { IconType } from "./Icon";

import styles from "./Note.module.css";

type Type = "note" | "quote" | "warn";

export default function Note({
  children,
  title = "Note",
  type = "note",
}: PropsWithChildren & { title?: string; type?: Type }) {
  let iconType: IconType;
  switch (type) {
    case "note":
      iconType = "note";
      break;
    case "quote":
      iconType = "quote";
      break;
    case "warn":
      iconType = "warn";
      break;
  }

  return (
    <div className={styles.Note} data-type={type}>
      <div className={styles.Header}>
        <Icon className={styles.Icon} type={iconType} />
        {title}
      </div>
      <div className={styles.Content}>{children}</div>
    </div>
  );
}
