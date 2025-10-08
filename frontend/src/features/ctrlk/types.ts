import { ReactNode } from "react";

export type CtrlKPathOptionType<T> = {
  readonly?: boolean; // For editor mode
  id?: string; // Current item id for editor mode
  query?: string; // Current query
  internalQuery?: Partial<T> | any; // Invisible filter or initial state for editor mode
  entity?: string; // Search entity (ex. "contacts")
  editor?: (props: { id: string }) => ReactNode;
  onClick?: (items: T[], event: MouseEvent) => void; // Action to apply on selection
  selected?: T[]; // Selected items in search mode
  returnAfterEditing?: boolean; // After editing, return to previous path instead of closing
  cb?: (item: T) => Promise<void>; // Callback to apply on selection
};

export type CtrlKOptionsType = {
  label: string | ReactNode;
  keywords?: string[];
  priority?: number;
  icon?: (p: any) => React.ReactNode;
  className?: string;
  action?: (event: MouseEvent) => void;
  to?: string;
};

export type CtrlKPathType<T> = {
  id?: string; // Unique id for the path item
  mode:
    | "action" // Search actions to apply on selection
    | "search" // Search items
    | "editor"; // Create a new item (enlarge the modal)
  select?: boolean; // Allow to select multiple items
  options?: CtrlKPathOptionType<T>; // Additional options for any mode
};

export type CtrlKStateType<T> = {
  id?: string; // Unique identifier for this state instance
  path: CtrlKPathType<T>[]; // Empty: not open, else: path to current state, for instance
  selection: { entity: string; items: T[] }; // For actions, the selected items on which the action will be applied
};
