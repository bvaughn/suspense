import { ReactNode } from "react";

import styles from "./SubHeading.module.css";

export default function SubHeading({ title }: { title: ReactNode }) {
  return <div className={styles.SubHeading}>{title}</div>;
}
