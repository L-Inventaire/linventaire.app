import { isEqual } from "lodash";
import { useEffect } from "react";

const globalEffectDepsMap = new Map<string, ReadonlyArray<any>>();

export const flushGlobalEffects = () => {
  globalEffectDepsMap.clear();
};

export const useGlobalEffect = (
  key: string,
  callback: (...args: any[]) => any,
  deps: ReadonlyArray<any>
) => {
  //Hack to avoid linter telling us what to do
  (useEffect as any)(() => {
    if (isEqual(globalEffectDepsMap.get(key), deps) === false) {
      globalEffectDepsMap.set(key, deps);
      return (() => {
        callback();
      })();
    }
  }, deps as any[]);
};
