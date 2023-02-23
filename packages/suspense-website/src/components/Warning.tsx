import { PropsWithChildren } from "react";
import Icon from "./Icon";

import styles from "./Warning.module.css";

export default function Warning({ children }: PropsWithChildren) {
  return (
    <div className={styles.Warning}>
      <Icon className={styles.Icon} type="warn" /> {children}
    </div>
  );
}
