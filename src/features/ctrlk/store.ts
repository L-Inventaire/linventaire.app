import { atom } from "recoil";
import { CtrlKStateType } from "./types";

export const CtrlKAtom = atom<CtrlKStateType<any>>({
  key: "CtrlKAtom",
  default: {
    path: [],
    selection: [],
  },
});
