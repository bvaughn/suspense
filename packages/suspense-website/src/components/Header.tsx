import { Link } from "react-router-dom";
import styles from "./Header.module.css";

export default function Header({ title }: { title: string }) {
  return (
    <h1 className={styles.Header}>
      <Link className={styles.HomeLink} to="/">
        Home
      </Link>
      →<span className={styles.Title}>{title}</span>
    </h1>
  );
}
