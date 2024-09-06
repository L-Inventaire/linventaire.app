import { useSetRecoilState } from "recoil";
import { CtrlKAtom } from "./store";

export const useRegisterActiveSelection = <T>() => {
  const setCtrlK = useSetRecoilState(CtrlKAtom);

  return (entity: string, items: T[]) =>
    setCtrlK((states) => {
      // If already open we don't want to override the current selection
      if ((states[states.length - 1]?.path?.length || 0) > 0) return states;
      return [
        ...states,
        { ...(states[states.length - 1] || {}), selection: { entity, items } },
      ];
    });
};
