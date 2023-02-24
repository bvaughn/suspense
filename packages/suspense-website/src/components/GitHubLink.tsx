import { ExternalLink } from "./ExternalLink";
import styles from "./GitHubLink.module.css";
import Icon from "./Icon";

export default function GitHubLink() {
  return (
    <ExternalLink
      className={styles.Link}
      to="https://github.com/bvaughn/suspense/"
    >
      <div className={styles.Label}>Suspense</div>
      <Icon className={styles.Icon} type="github" />
    </ExternalLink>
  );
}
