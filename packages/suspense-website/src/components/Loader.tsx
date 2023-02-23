import Icon from "./Icon";
import styles from "./Loader.module.css";

export default function Loader() {
  return (
    <div className={styles.Loader}>
      <Icon type="loading" /> Loading
    </div>
  );
}
