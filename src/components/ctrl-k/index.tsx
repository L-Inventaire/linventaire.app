import { Modal } from "@atoms/modal/modal";
import { atom, useRecoilValue } from "recoil";
import { ModalEditor } from "./editor";
import { SearchCtrlK } from "./search";
import { CtrlKOptionsType, CtrlKStateType } from "./types";

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

export const CtrlKAtom = atom<CtrlKStateType<any>>({
  key: "CtrlKAtom",
  default: {
    path: [],
    selection: [],
  },
});

export let rootNavigationItems: CtrlKOptionsType[] = [];
export const registerRootNavigation = (
  options: CtrlKOptionsType & { to: string }
) => {
  rootNavigationItems = [
    ...rootNavigationItems.filter((a) => a.to !== options.to),
    options,
  ];
};

export const CtrlKModal = () => {
  const state = useRecoilValue(CtrlKAtom);
  const currentState = state.path[state.path.length - 1] || {};

  return (
    <Modal
      open={state.path.length > 0}
      closable={false}
      positioned
      style={{
        marginTop: currentState.mode === "create" ? "50px" : "10vh",
        maxHeight:
          currentState.mode === "create" ? "calc(100vh - 100px)" : "80vh",
        maxWidth:
          currentState.mode === "search"
            ? "1200px"
            : currentState.mode === "create"
            ? "calc(100vw - 100px)"
            : "",
      }}
    >
      {currentState.mode !== "create" && (
        <div className="-m-6" style={{ maxHeight: "inherit" }}>
          <SearchCtrlK />
        </div>
      )}
      {currentState.mode === "create" && (
        <div
          className="-m-6 grow flex flex-col"
          style={{
            maxHeight: "inherit",
            height: "calc(100vh - 100px)",
          }}
        >
          <ModalEditor />
        </div>
      )}
    </Modal>
  );
};
