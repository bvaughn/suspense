import { PropsWithChildren } from "react";

import styles from "./Warning.module.css";

export default function Warning({ children }: PropsWithChildren) {
  return <div className={styles.Warning}>{children}</div>;
}
