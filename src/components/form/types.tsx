import { ReactNode } from "react";

export type ValuesObjectType = {
  [key: string]: string | number | boolean | Date | string[] | any;
};

export type SearchFormDiplayType = {
  default?: string[];
  groups?: {
    key: string;
    items: {
      label: string;
      value: string;
      fields?: SearchFormDiplayType["default"];
    }[];
  };
  advanced?: {
    default?: SearchFormDiplayType["default"];
    groups?: SearchFormDiplayType["groups"];
  };
};

export type SearchFormFieldType = (
  | {
      // undefined: appear in the primary line view
      // advanced: appear in the advanced view
      // string: appear under a group managed by an other field of type "group"
      position?: undefined | "advanced" | string;
      key: string;
      label?: string;
      type?:
        | "text"
        | "select"
        | "date"
        | "boolean"
        | "select_boolean"
        | "number"
        | "formatted"
        | "multiselect"
        | "searchselect"
        | "modal"
        | "scan"; //Default is text
      placeholder?: string;
      disabled?: boolean;
      options?: //Only for select and multiselect
      | {
            label: string;
            value: string;
          }[]
        | ((query: string) => Promise<
            {
              label: string;
              value: string;
            }[]
          >);
    }
  | {
      position?: undefined | "advanced";
      key: string;
      type: "group";
      options:
        | {
            label: string;
            value: string;
          }[];
      label?: string;
      placeholder?: string;
    }
  | {
      position?: undefined | "advanced" | string;
      key: string;
      type: "custom";
      node: <T>(arg: { onChange: (v: T) => void; value: T }) => ReactNode;
      options?: [];
      label?: string;
      placeholder?: string;
    }
) & {
  onClick?: (opts: { readonly?: boolean; values: any }) => void;
  alwaysVisible?: boolean; //Force display the input in readonly mode even if nullish value
  min?: number; //Min value for number inputs
  max?: number; //Max value for number inputs, or max number of items for multi selects
  format?: "price" | "percentage" | "mail" | "phone";
  render?: (value: any, values: any) => string | ReactNode;
  autoFocus?: "scan" | "keyboard" | boolean;
};
