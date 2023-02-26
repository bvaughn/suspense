import { PropsWithChildren } from "react";

import styles from "./Block.module.css";

export default function Block({
  children,
  type,
}: PropsWithChildren & { type?: "normal" | "demo" }) {
  return (
    <div className={styles.Block} data-type={type}>
      {children}
    </div>
  );
}
