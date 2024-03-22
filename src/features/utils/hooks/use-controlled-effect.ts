import { useEffect } from "react";

//Hack to avoid linter telling us what to do
export const useControlledEffect = useEffect as (
  callback: () => void | (() => void) | Promise<void> | (() => Promise<void>),
  dependencies: any[]
) => void;
