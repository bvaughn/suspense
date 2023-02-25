import { ReactNode } from "react";

import styles from "./SubHeading.module.css";

export default function SubHeading({ title }: { title: ReactNode }) {
  const id = title.toString().toLowerCase().replace(/\s/g, "-");

  return (
    <h2 className={styles.SubHeading} id={id}>
      {title}
    </h2>
  );
}
