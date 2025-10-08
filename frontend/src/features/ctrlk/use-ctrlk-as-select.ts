import { useSetRecoilState } from "recoil";
import { CtrlKAtom, generateUniqueStateId } from "./store";

export const useCtrlKAsSelect = () => {
  const setCtrlK = useSetRecoilState(CtrlKAtom);

  return <T>(
    entity: string,
    filter: any,
    cb: (entities: T[]) => void,
    max: number = 1,
    selected: T[] = []
  ) => {
    setCtrlK((states) => [
      ...states,
      {
        ...(states[states.length - 1] || {}),
        id: generateUniqueStateId(),
        path: [
          {
            mode: "search",
            select: max > 1,
            options: {
              entity: entity,
              internalQuery: filter,
              onClick: cb,
              selected: max > 1 ? selected : undefined,
            },
          },
        ],
      },
    ]);
  };
};
