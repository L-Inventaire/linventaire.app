import _ from "lodash";
import { useEffect, useRef } from "react";

/**
 * Trigger only when value changed and not when it initialized (undefined / null to value)
 */
export const useEffectChange = <T>(
  callback: (arg: T[]) => void | (() => void),
  value: T[] = []
) => {
  const previousValue = useRef<T[]>(value);
  useEffect(() => {
    const tmp = previousValue.current;
    if (
      previousValue.current.every((val) => {
        return (
          val === undefined ||
          val === null ||
          _.isEqual(val, value[tmp.indexOf(val)])
        );
      })
    ) {
      previousValue.current = _.cloneDeep(value);
      return;
    }
    previousValue.current = _.cloneDeep(value);
    return callback(tmp);
  }, value);
};
