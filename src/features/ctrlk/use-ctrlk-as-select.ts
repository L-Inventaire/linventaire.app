import { useSetRecoilState } from "recoil";
import { CtrlKAtom } from "./store";

export const useCtrlKAsSelect = () => {
  const setCtrlK = useSetRecoilState(CtrlKAtom);

  return <T>(entity: string, filter: any, cb: (entity: T) => void) =>
    setCtrlK({
      selection: [],
      path: [
        {
          mode: "search",
          options: {
            entity: entity,
            internalQuery: filter,
            onClick: cb,
          },
        },
      ],
    });
};
