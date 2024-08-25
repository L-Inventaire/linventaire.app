import { useSetRecoilState } from "recoil";
import { CtrlKAtom } from "./store";

export const useEditFromCtrlK = () => {
  const setCtrlK = useSetRecoilState(CtrlKAtom);

  return (entity: string, id?: string) =>
    setCtrlK((state) => ({
      ...state,
      path: [
        {
          mode: "editor",
          options: {
            entity: entity,
            id,
            internalQuery: { description: "<p>Hey !</p>" },
          },
        },
      ],
    }));
};
