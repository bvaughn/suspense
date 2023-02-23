import { PropsWithChildren } from "react";

import styles from "./Block.module.css";

export default function Block({ children }: PropsWithChildren) {
  return <div className={styles.Block}>{children}</div>;
}
