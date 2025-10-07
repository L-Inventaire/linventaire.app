import _ from "lodash";
import { useEffect, useRef } from "react";
import { useRecoilState } from "recoil";
import { CtrlKAtom } from "./store";

export const useRegisterActiveSelection = <T>() => {
  const [state, setCtrlK] = useRecoilState(CtrlKAtom);
  const indexRef = useRef(state.length - 1);

  useEffect(() => {
    setCtrlK((states) => {
      if (!states[indexRef.current]) {
        states = [
          ...states,
          { path: [], selection: { entity: "", items: [] } },
        ];
      }
      return states;
    });
  }, [setCtrlK]);

  return {
    register: (entity: string, items: T[]) =>
      setCtrlK((states) => {
        const newStates = _.cloneDeep(states);
        if (!newStates[indexRef.current]) {
          newStates[indexRef.current] = {
            path: [],
            selection: { entity: "", items: [] },
          };
        }
        newStates[indexRef.current].selection = { entity, items };
        return newStates;
      }),
    unregister: () =>
      setCtrlK((states) => {
        // Remove state at indexRef.current
        return states.filter((_, i) => i !== indexRef.current);
      }),
    runActions: () => {
      setCtrlK((states) => {
        const newStates = _.cloneDeep(states);
        newStates[indexRef.current].path = [
          {
            mode: "action",
          },
        ];
        return newStates;
      });
    },
  };
};
