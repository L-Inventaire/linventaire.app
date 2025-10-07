import { DocumentBar } from "@components/document-bar";
import { withSearchAsModelObj } from "@components/search-bar/utils/as-model";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { CtrlKRestEntities } from "@features/ctrlk";
import { CtrlKAtom } from "@features/ctrlk/store";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { useRestSchema } from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import _ from "lodash";
import { useCallback } from "react";
import Scrollbars from "react-custom-scrollbars";
import { useRecoilState } from "recoil";

export const ModalEditor = (props: { stateId: string }) => {
  const [states, setStates] = useRecoilState(CtrlKAtom);

  const state = states.find((s) => s.id === props.stateId);
  const setState = (newState: any) => {
    setStates((states) => {
      const newStates = [...states];
      const targetIndex = newStates.findIndex((s) => s.id === props.stateId);
      if (targetIndex !== -1) {
        newStates[targetIndex] = newState;
      }
      return newStates;
    });
  };

  if (!state) {
    return null; // State not found
  }

  const currentState = state.path?.[state.path?.length - 1] || {};
  const previousState = state.path?.[state.path?.length - 2] || {};

  const defaultData =
    CtrlKRestEntities[currentState.options?.entity || ""]?.useDefaultData?.() ||
    {};

  const schema = useRestSchema(currentState.options?.entity || "");

  const { draft, save, isInitiating, remove, restore } = useDraftRest(
    currentState.options?.entity || "",
    currentState.options?.id || "new",
    async (item: RestEntity) => {
      // Set created element as query for the previous path
      const newPath = state.path.slice(0, state.path.length - 1);
      if (newPath.length === 0) {
        // No previous path, go back to read mode
        onChangeMode("read");
        return;
      }
      let lastItem = newPath.pop();
      if (lastItem) {
        lastItem = _.set(
          _.cloneDeep(lastItem || ({} as any)),
          "options.query",
          `id:"${item.id}" `
        );
        newPath.push(lastItem);
      }
      setState({
        ...state,
        path: newPath,
      });
    },
    _.merge(
      defaultData,
      withSearchAsModelObj(
        schema.data!,
        {},
        buildQueryFromMap(
          currentState?.options?.internalQuery ||
            previousState?.options?.internalQuery ||
            {}
        ),
        { keepArraysFirst: true } // Used for supplier invoice where query use a "or"
      ) || {}
    )
  );

  const onClose = async () => {
    setState({
      ...state,
      path: state.path.slice(0, state.path.length - 1),
    });
  };

  const onSave = async () => {
    await save();
    if (currentState?.options?.cb) await currentState.options.cb(draft);
  };

  const onChangeMode = useCallback(
    (mode: "write" | "read") => {
      setState({
        ...state,
        path: [
          {
            ...currentState,
            options: {
              ...currentState.options,
              readonly: mode !== "write",
            },
          },
        ],
      });
    },
    [currentState, state, setState]
  );

  const footer = CtrlKRestEntities[
    currentState.options?.entity || ""
  ]?.renderActionsBar?.({
    id: currentState.options?.id || "",
    readonly: currentState.options?.readonly,
  });

  return (
    <div className="grow flex-col flex relative">
      <div className="border-b flex min-h-12 border-slate-100 dark:border-slate-700 shrink-0">
        {CtrlKRestEntities[
          currentState.options?.entity || ""
        ]?.renderDocumentBar?.({
          id: currentState.options?.id || "",
          readonly: currentState.options?.readonly,
          onClose,
          onSave,
          onChangeMode,
        }) || (
          <DocumentBar
            loading={isInitiating}
            entity={currentState.options?.entity || ""}
            document={draft}
            mode={currentState.options?.readonly ? "read" : "write"}
            onClose={onClose}
            onSave={onSave}
            onRemove={draft.id ? remove : undefined}
            onRestore={draft.id ? restore : undefined}
            onChangeMode={onChangeMode}
          />
        )}
      </div>
      <Scrollbars>
        <div className="p-4">
          {CtrlKRestEntities[currentState.options?.entity || ""]
            ?.renderEditor &&
            CtrlKRestEntities[
              currentState.options?.entity || ""
            ]?.renderEditor?.({
              id: currentState.options?.id || "",
              readonly: currentState.options?.readonly,
            })}
        </div>
      </Scrollbars>
      {!!footer && (
        <div className="border-t border-solid border-slate-100 dark:border-slate-700 p-3">
          {footer}
        </div>
      )}
    </div>
  );
};
