import { PropsWithChildren } from "react";
import Icon from "./Icon";

import styles from "./Note.module.css";

type Type = "note" | "warn";

export default function Note({
  children,
  title = "Note",
  type = "note",
}: PropsWithChildren & { title?: string; type?: Type }) {
  return (
    <div className={styles.Note} data-type={type}>
      <div className={styles.Header}>
        <Icon className={styles.Icon} type="warn" />
        {title}
      </div>
      <div className={styles.Content}>{children}</div>
    </div>
  );
}
