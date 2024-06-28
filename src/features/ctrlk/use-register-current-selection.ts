import { useSetRecoilState } from "recoil";
import { CtrlKAtom } from "./store";

export const useRegisterActiveSelection = <T>() => {
  const setCtrlK = useSetRecoilState(CtrlKAtom);

  return (entity: string, items: T[]) =>
    setCtrlK((state) => {
      // If already open we don't want to override the current selection
      if (state.path.length > 0) return state;
      return { ...state, selection: { entity, items } };
    });
};
