import _ from "lodash";
import { createContext, useContext } from "react";

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

export function useFormController<T extends Object>(
  get: T,
  set: (e: any) => void
) {
  return (key: keyof T | string[]) => {
    return {
      value: _.get(get, key),
      onChange: (value: any) => {
        set((prev: T) => {
          return _.set({ ...prev }, key, value);
        });
      },
    };
  };
}
