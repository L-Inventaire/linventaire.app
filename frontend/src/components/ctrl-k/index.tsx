import { Modal } from "@atoms/modal/modal";
import { CtrlKAtom } from "@features/ctrlk/store";
import { CtrlKStateType } from "@features/ctrlk/types";
import { DraftContext } from "@features/utils/rest/hooks/use-draft-rest";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRecoilState } from "recoil";
import { ModalEditor } from "./editor";
import { SearchCtrlK } from "./search";

/*
[selection] Scenario 1:
- Select items in a list of contacts
- Click on Ctrl+K
- A list of actions and keys to modify will be proposed, and filtered by the search input
- Select key "tags"
- We are now in "search" mode for tags, in addition to results we have actions, like "cancel" and "+ Current Query", tags used in all selection appears as "delete XXX"
- Creating a tag  create it and affect it to the selected contacts
- Ctrl+K is closed and list should refresh in the background

[selection] Scenario 2:
- Select items in a list of contacts
- Click on Ctrl+K
- A list of actions and keys to modify will be proposed, and filtered by the search input
- Select key "parents"
- We are now in "search" mode for other contacts, in addition to results we have actions, like "cancel" and "+ Current Query", contacts used in all selection appears as "delete XXX"
- Creating a parent happens in the ctrl+K modal
- When done, we get back to "search" previous path, but with query set to the new parent's label

✅ [search] Scenario 3:
- Click on Ctrl+K without selection
- A list of entities is proposed, like "contacts", "tags", "invoices", as well as a list of actions (go to invoices etc)
- Search can filter this actions by keyword (ex. "invoice")
- Select "Search Invoices"
- We are now in "search" mode but for entity_type "invoices"
- We can search for invoices, when selecting one, it opens it and close the ctrl+K
*/

export const CtrlKModal = () => {
  const [states, setStates] = useRecoilState(CtrlKAtom);

  useEffect(() => {
    // remove all items with path length 0
    setStates((states) =>
      states.filter((state, i) => i === 0 || state.path.length > 0)
    );
  }, [states.length]);

  const { pathname } = useLocation();
  useEffect(() => {
    // Close all modals on path change
    setStates(() => []);
  }, [pathname]);

  return states.map((state, index) => {
    const setState = (newState: CtrlKStateType<any>) => {
      setStates((states) => {
        const newStates = [...states];
        const targetIndex = newStates.findIndex((s) => s.id === state.id);
        if (targetIndex !== -1) {
          newStates[targetIndex] = newState;
        }
        return newStates;
      });
    };

    const currentState = state.path?.[state.path?.length - 1] || {};
    return (
      <Modal
        key={state.id || index}
        open={(state.path?.length || 0) > 0}
        closable={false}
        onClose={() => {
          setState({
            ...state,
            path: state.path.slice(0, state.path.length - 1),
          });
        }}
        positioned
        style={{
          marginTop: currentState.mode === "editor" ? "50px" : "10vh",
          maxHeight:
            currentState.mode === "editor" ? "calc(100vh - 100px)" : "80vh",
          maxWidth:
            currentState.mode === "search"
              ? "1200px"
              : currentState.mode === "editor"
              ? "calc(100vw - 100px)"
              : "",
        }}
      >
        <DraftContext.Provider
          value={{
            key: "ctrlk_" + (state.id || index) + "_" + state.path?.length,
            isModal: true,
          }}
        >
          {currentState.mode !== "editor" && (
            <div className="-m-6" style={{ maxHeight: "inherit" }}>
              <SearchCtrlK stateId={state.id || `fallback_${index}`} />
            </div>
          )}
          {currentState.mode === "editor" && (
            <div
              className="-m-6 grow flex flex-col"
              style={{
                maxHeight: "inherit",
                height: "calc(100vh - 100px)",
              }}
            >
              <ModalEditor stateId={state.id || `fallback_${index}`} />
            </div>
          )}
        </DraftContext.Provider>
      </Modal>
    );
  });
};
