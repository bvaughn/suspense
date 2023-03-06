import { useCallback, useState } from "react";

type ForceUpdate = () => void;

export function useForceUpdate(): ForceUpdate {
  const [, setState] = useState(0);
  const forceUpdate = useCallback<ForceUpdate>(
    () => setState((prevState) => prevState + 1),
    []
  );
  return forceUpdate;
}
