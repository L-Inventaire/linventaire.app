import { DocumentBar } from "@components/document-bar";
import { withSearchAsModelObj } from "@components/search-bar/utils/as-model";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { CtrlKRestEntities } from "@features/ctrlk";
import { CtrlKAtom } from "@features/ctrlk/store";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { useRestSchema } from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import _ from "lodash";
import Scrollbars from "react-custom-scrollbars";
import { useRecoilState } from "recoil";

export const ModalEditor = (props: { index: number }) => {
  const [states, setStates] = useRecoilState(CtrlKAtom);

  const state = states[props.index];
  const setState = (newState: any) => {
    setStates((states) => {
      const newStates = [...states];
      newStates[props.index] = newState;
      return newStates;
    });
  };

  const currentState = state.path[state.path.length - 1] || {};
  const previousState = state.path[state.path.length - 2] || {};

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

  return (
    <div className="grow flex-col flex relative">
      <div className="border-b flex min-h-12 border-slate-100 dark:border-slate-700 shrink-0">
        <DocumentBar
          loading={isInitiating}
          entity={currentState.options?.entity || ""}
          document={draft}
          mode={"write"}
          onClose={async () => {
            setState({
              ...state,
              path: state.path.slice(0, state.path.length - 1),
            });
          }}
          onSave={async () => {
            await save();
            if (currentState?.options?.cb) await currentState.options.cb(draft);
          }}
          onRemove={draft.id ? remove : undefined}
          onRestore={draft.id ? restore : undefined}
        />
      </div>
      <Scrollbars>
        <div className="p-4">
          {CtrlKRestEntities[currentState.options?.entity || ""]
            ?.renderEditor &&
            CtrlKRestEntities[
              currentState.options?.entity || ""
            ]?.renderEditor?.({
              id: currentState.options?.id || "",
            })}
        </div>
      </Scrollbars>
    </div>
  );
};
