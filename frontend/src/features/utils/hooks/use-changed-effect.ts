import _ from "lodash";
import { useEffect, useRef } from "react";

/**
 * Trigger only when value changed
 */
export const useEffectChange = <T>(
  callback: (arg: T[]) => void | (() => void),
  value: T[] = []
) => {
  const previousValue = useRef(value);
  useEffect(() => {
    const tmp = previousValue.current;
    if (_.isEqual(value, tmp)) return;
    previousValue.current = _.cloneDeep(value);
    return callback(tmp);
  }, value);
};
