import { atom } from "recoil";
import { CtrlKStateType } from "./types";

export const generateUniqueStateId = (): string => {
  return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const CtrlKAtom = atom<CtrlKStateType<any>[]>({
  key: "CtrlKAtom",
  default: [
    {
      id: "default_state",
      path: [],
      selection: { entity: "", items: [] },
    },
  ],
});
