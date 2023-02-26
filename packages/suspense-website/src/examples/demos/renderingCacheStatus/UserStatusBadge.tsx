import { userProfileCache } from "./index";
import Icon, { IconType } from "../../../components/Icon";

// REMOVE_BEFORE

import { useCacheStatus } from "suspense";

function UserStatusBadge({ id }: { id: number }) {
  const status = useCacheStatus(userProfileCache, id);

  let type: IconType;
  switch (status) {
    case "not-started":
      type = "status-not-started";
      break;
    case "pending":
      type = "status-pending";
      break;
    case "resolved":
      type = "status-resolved";
      break;
  }

  return <Icon type={type} />;
}

// REMOVE_AFTER

export { UserStatusBadge };
