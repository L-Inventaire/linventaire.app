import _ from "lodash";
import { createContext, useContext, useRef } from "react";
import { atomFamily, useRecoilState } from "recoil";

export const FormContextContext = createContext<{
  readonly: boolean;
  alwaysVisible: boolean;
  size: "sm" | "md";
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
  size?: "sm" | "md";
  readonly?: boolean;
  alwaysVisible?: boolean;
  highlight?: boolean;
  disabled?: boolean;
}) => {
  const def = useContext(FormContextContext);
  return (
    <FormContextContext.Provider
      value={{
        readonly:
          context.readonly === undefined ? def.readonly : context.readonly,
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

export type FormControllerFuncType<T> = (
  key: keyof T | NestedKey<string, string>
) => FormControllerType<any>;

export type FormControllerType<T> = {
  value: T;
  onChange: (value: T) => void;
};

const FormControllerLockAtom = atomFamily<any, string>({
  key: "FormControllerLockAtom",
  default: false,
});

type NestedKey<T extends string, P extends string> = `${T}.${P}`;

export function useFormController<T extends object>(
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
            !_.isEqual(_.get(get, key), value) &&
            [value, _.get(get, key)].filter((a) => a).length // If we gone from null to empty string or similar, ignore change
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
