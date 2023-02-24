import styles from "./GitHubLink.module.css";
import Icon from "./Icon";

export default function GitHubLink() {
  return (
    <a
      className={styles.Link}
      href="https://github.com/bvaughn/suspense/"
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className={styles.Label}>Suspense</div>
      <Icon className={styles.Icon} type="github" />
    </a>
  );
}
