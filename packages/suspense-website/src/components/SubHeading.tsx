import { ReactNode } from "react";

import styles from "./SubHeading.module.css";

export default function SubHeading({
  level = 1,
  title,
}: {
  level?: number;
  title: string;
}) {
  const id = title.toLowerCase().replace(/\s/g, "-");

  return (
    <h2 className={styles.SubHeading} data-level={level} id={id}>
      {title}
    </h2>
  );
}
