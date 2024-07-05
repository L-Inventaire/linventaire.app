import { DocumentBar } from "@components/document-bar";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import Scrollbars from "react-custom-scrollbars";
import { useRecoilState } from "recoil";
import { CtrlKAtom } from "@features/ctrlk/store";
import _ from "lodash";
import { RestEntity } from "@features/utils/rest/types/types";
import { CtrlKRestEntities } from "@features/ctrlk";
import { useRestSchema } from "@features/utils/rest/hooks/use-rest";
import { withSearchAsModelObj } from "@components/search-bar/utils/as-model";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";

export const ModalEditor = () => {
  const [state, setState] = useRecoilState(CtrlKAtom);
  const currentState = state.path[state.path.length - 1] || {};
  const previousState = state.path[state.path.length - 2] || {};

  const defaultData =
    CtrlKRestEntities[currentState.options?.entity || ""]?.useDefaultData?.() ||
    {};

  const schema = useRestSchema(currentState.options?.entity || "");

  const { draft, save, isInitiating } = useDraftRest(
    currentState.options?.entity || "",
    "new",
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

      console.log(lastItem, {
        ...state,
        path: newPath,
      });

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
        buildQueryFromMap(previousState?.options?.internalQuery || {}),
        { keepArraysFirst: true } // Used for supplier invoice where query use a "or"
      )
    )
  );

  return (
    <>
      <div className="grow flex-col flex relative">
        <div className="border-b flex min-h-12 border-slate-100 dark:border-slate-700 shrink-0">
          <DocumentBar
            loading={isInitiating}
            entity={currentState.options?.entity || ""}
            document={draft}
            mode={"write"}
            onClose={() => {
              setState({
                ...state,
                path: state.path.slice(0, state.path.length - 1),
              });
            }}
            onSave={async () => {
              await save();
            }}
          />
        </div>
        <Scrollbars>
          <div className="p-4">
            {CtrlKRestEntities[currentState.options?.entity || ""]
              ?.renderEditor &&
              CtrlKRestEntities[
                currentState.options?.entity || ""
              ]?.renderEditor?.({
                id: "",
              })}
          </div>
        </Scrollbars>
      </div>
    </>
  );
};
