import { PropsWithChildren } from "react";
import Icon from "./Icon";

import styles from "./Note.module.css";

export default function Note({ children }: PropsWithChildren) {
  return (
    <div className={styles.Note}>
      <Icon className={styles.Icon} type="info" /> {children}
    </div>
  );
}
