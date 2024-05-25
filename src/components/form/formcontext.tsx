import _ from "lodash";
import { createContext, useContext, useRef } from "react";
import { atomFamily, useRecoilState } from "recoil";

export const FormContextContext = createContext<{
  readonly: boolean;
  alwaysVisible: boolean;
  size: "md" | "lg";
  highlight: boolean;
  disabled: boolean;
}>({
  readonly: false,
  alwaysVisible: false,
  size: "md",
  highlight: false,
  disabled: false,
});

export const FormContext = ({
  children,
  ...context
}: {
  children: any;
  size?: "md" | "lg";
  readonly?: boolean;
  alwaysVisible?: boolean;
  highlight?: boolean;
  disabled?: boolean;
}) => {
  const def = useContext(FormContextContext);
  return (
    <FormContextContext.Provider
      value={{
        readonly: context.readonly || def.readonly,
        alwaysVisible: context.alwaysVisible || def.alwaysVisible,
        size: context.size || def.size,
        highlight: context.highlight || def.highlight,
        disabled: context.disabled || def.disabled,
      }}
    >
      {children}
    </FormContextContext.Provider>
  );
};

export type FormControllerType = {
  value: any;
  onChange: (value: any) => void;
};

const FormControllerLockAtom = atomFamily<any, string>({
  key: "FormControllerLockAtom",
  default: false,
});

type NestedKey<T extends string, P extends string> = `${T}.${P}`;

export function useFormController<T extends Object>(
  get: T,
  set: (e: any) => void,
  key?: string
) {
  const initial = useRef({ ...get });
  const [lockNavigation, setLockNavigation] = useRecoilState(
    FormControllerLockAtom(key || "default")
  );
  return {
    lockNavigation,
    setLockNavigation,
    ctrl: (key: keyof T | NestedKey<string, string>) => {
      return {
        value: _.get(get, key),
        onChange: (value: keyof T | any) => {
          // Only if there is a real change somewhere
          if (
            !_.isEqual((get as any)[key], value) &&
            [value, (get as any)[key]].filter((a) => a).length // If we gone from null to empty string or similar, ignore change
          ) {
            setLockNavigation(_.isEqual(initial.current, get) === false);
            set((prev: T) => {
              return _.set(_.cloneDeep(prev), key, value);
            });
          }
        },
      };
    },
  };
}
