import { ReactNode } from "react";

export type CtrlKPathOptionType<T> = {
  query?: string; // Current query
  internalQuery?: any;
  entity?: string; // Search entity (ex. "contacts")
  editor?: (props: { id: string }) => ReactNode;
  onClick?: (item: T, event: MouseEvent) => void; // Action to apply on selection
};

export type CtrlKPathType<T> = {
  mode:
    | "action" // Search actions to apply on selection
    | "search" // Search items
    | "create"; // Create a new item (enlarge the modal)
  options?: CtrlKPathOptionType<T>; // Additional options for any mode
};

export type CtrlKOptionsType = {
  label: string;
  keywords?: string[];
  priority?: number;
  icon?: (p: any) => React.ReactNode;
  action?: (event: MouseEvent) => void;
  to?: string;
};

export type CtrlKStateType<T> = {
  path: CtrlKPathType<T>[]; // Empty: not open, else: path to current state, for instance
  selection: T[]; // For actions, the selected items on which the action will be applied
};
