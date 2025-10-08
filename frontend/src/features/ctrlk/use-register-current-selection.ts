import _ from "lodash";
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useRecoilState } from "recoil";
import { CtrlKAtom } from "./store";

export const useRegisterActiveSelection = <T>() => {
  const [, setCtrlK] = useRecoilState(CtrlKAtom);
  const stateIdRef = useRef<string>();
  const { pathname } = useLocation();

  // Generate a unique ID for this state instance
  if (!stateIdRef.current) {
    stateIdRef.current = `state_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  const unregister = useCallback(() => {
    setCtrlK((states) => {
      // Remove state with matching ID
      return states.filter((state) => state.id !== stateIdRef.current);
    });
  }, [setCtrlK]);

  useEffect(() => {
    setCtrlK((states) => {
      const existingState = states.find(
        (state) => state.id === stateIdRef.current
      );
      if (!existingState) {
        return [
          ...states,
          {
            id: stateIdRef.current,
            path: [],
            selection: { entity: "", items: [] },
          },
        ];
      }
      return states;
    });
    return () => {
      unregister();
    };
  }, [setCtrlK, pathname]);

  return {
    register: (entity: string, items: T[]) =>
      setCtrlK((states) => {
        const newStates = _.cloneDeep(states);
        const targetStateIndex = newStates.findIndex(
          (state) => state.id === stateIdRef.current
        );

        if (targetStateIndex === -1) {
          // State doesn't exist, create it
          newStates.push({
            id: stateIdRef.current,
            path: [],
            selection: { entity, items },
          });
        } else {
          // Update existing state
          newStates[targetStateIndex].selection = { entity, items };
        }
        return newStates;
      }),
    unregister,
    runActions: () => {
      setCtrlK((states) => {
        const newStates = _.cloneDeep(states);
        const targetStateIndex = newStates.findIndex(
          (state) => state.id === stateIdRef.current
        );

        if (targetStateIndex !== -1) {
          newStates[targetStateIndex].path = [
            {
              mode: "action",
            },
          ];
        }
        return newStates;
      });
    },
  };
};
