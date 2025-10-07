import { useSetRecoilState } from "recoil";
import { CtrlKRestEntities } from ".";
import { CtrlKAtom, generateUniqueStateId } from "./store";

export const useViewWithCtrlK = () => {
  return useEditFromCtrlK(true);
};

export const useEditFromCtrlK = (readonly?: boolean) => {
  const setCtrlK = useSetRecoilState(CtrlKAtom);

  return <T>(
    entity: string,
    id?: string,
    initialState?: Partial<T>,
    cb?: (entity: T) => Promise<void>
  ) => {
    if (CtrlKRestEntities[entity]?.renderEditor) {
      setCtrlK((states) => [
        ...states,
        {
          ...(states[states.length - 1] || {}),
          id: generateUniqueStateId(),
          path: [
            {
              mode: "editor",
              options: {
                readonly,
                entity: entity,
                id,
                internalQuery: initialState,
                cb,
              },
            },
          ],
        },
      ]);
    }
  };
};
