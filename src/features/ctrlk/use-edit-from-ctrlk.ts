import { useSetRecoilState } from "recoil";
import { CtrlKAtom } from "./store";

export const useEditFromCtrlK = () => {
  const setCtrlK = useSetRecoilState(CtrlKAtom);

  return <T>(entity: string, id?: string, initialState?: Partial<T>) =>
    setCtrlK((state) => ({
      ...state,
      path: [
        {
          mode: "editor",
          options: {
            entity: entity,
            id,
            internalQuery: initialState,
          },
        },
      ],
    }));
};
