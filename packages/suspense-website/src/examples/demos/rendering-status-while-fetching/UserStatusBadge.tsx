import { userProfileCache } from "./index";
import Icon, { IconType } from "../../../components/Icon";

// REMOVE_BEFORE

import { useCacheStatus } from "suspense";

function UserStatusBadge({ id }: { id: number }) {
  const status = useCacheStatus(userProfileCache, id);

  let type: IconType;
  switch (status) {
    case "not-found":
      type = "status-not-found";
      break;
    case "pending":
      type = "status-pending";
      break;
    case "resolved":
      type = "status-resolved";
      break;
    default:
      return null;
  }

  return <Icon type={type} />;
}

// REMOVE_AFTER

export { UserStatusBadge };
