import Icon from "../../../components/Icon";
import styles from "./style.module.css";

export function SaveButton({
  hasPendingChanges = true,
  isPending,
  onClick,
}: {
  hasPendingChanges?: boolean;
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={styles.Button}
      disabled={!hasPendingChanges || isPending}
      onClick={onClick}
    >
      {isPending ? <Icon type="saving" /> : "Save"}
    </button>
  );
}
