import { DocumentBar } from "@components/document-bar";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import Scrollbars from "react-custom-scrollbars";
import { useRecoilState } from "recoil";
import { CtrlKAtom } from "@features/ctrlk/store";
import _ from "lodash";
import { RestEntity } from "@features/utils/rest/types/types";
import { RestEntities } from "@features/ctrlk";

export const ModalEditor = () => {
  const [state, setState] = useRecoilState(CtrlKAtom);
  const currentState = state.path[state.path.length - 1] || {};

  const { draft, save, isInitiating } = useDraftRest(
    currentState.options?.entity || "",
    "new",
    async (item: RestEntity) => {
      // Set created element as query for the previous path
      const newPath = state.path.slice(0, state.path.length - 1);
      _.set(_.last(newPath) || {}, "options.query", `id:"${item.id}"`);
      setState({
        ...state,
        path: newPath,
      });
    },
    _.merge(RestEntities[currentState.options?.entity || ""]?.defaultData, {})
  );

  return (
    <>
      <div className="grow flex-col flex relative">
        <div className="border-b flex min-h-12 border-slate-100 dark:border-slate-700 shrink-0">
          <DocumentBar
            loading={isInitiating}
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
            {RestEntities[currentState.options?.entity || ""]?.renderEditor &&
              RestEntities[currentState.options?.entity || ""]?.renderEditor({
                id: "",
              })}
          </div>
        </Scrollbars>
      </div>
    </>
  );
};
