import { Button } from "@atoms/button/button";
import { Modal } from "@atoms/modal/modal";
import { SearchBar } from "@components/search-bar";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { atom, useRecoilState } from "recoil";

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

[search] Scenario 3:
- Click on Ctrl+K without selection
- A list of entities is proposed, like "contacts", "tags", "invoices", as well as a list of actions (go to invoices etc)
- Search can filter this actions by keyword (ex. "invoice")
- Select "Search Invoices"
- We are now in "search" mode but for entity_type "invoices"
- We can search for invoices, when selecting one, it opens it and close the ctrl+K
*/

type CtrlKOptionsType = {
  label: string;
  keywords?: string[];
  priority?: number;
  icon?: (p: any) => React.ReactNode;
  action?: () => void;
};

type CtrlKPathType<T> = {
  mode:
    | "action" // Search actions to apply on selection
    | "search" // Search items
    | "create"; // Create a new item (enlarge the modal)
  entity?: string; // Search entity (ex. "contacts")
  options?: CtrlKOptionsType[]; // Additional options for any mode
};

export type CtrlKStateType<T> = {
  path: CtrlKPathType<T>[]; // Empty: not open, else: path to current state, for instance
  selection: T[]; // For actions, the selected items on which the action will be applied
};

export const CtrlKAtom = atom<CtrlKStateType<any>>({
  key: "CtrlKAtom",
  default: {
    path: [],
    selection: [],
  },
});

export const CtrlKModal = () => {
  const [state, setState] = useRecoilState(CtrlKAtom);
  const navigateAlt = useNavigateAlt();
  const close = () =>
    setState({
      path: [],
      selection: [],
    });
  return (
    <Modal open={state.path.length > 0} closable={false}>
      <div className="-m-6">
        <SearchBar
          inlineSuggestions
          inputClassName="py-2"
          schema={{ table: "ctrl+k", fields: [] }}
          onChange={console.log}
          showExport={false}
          autoFocus
          placeholder={"Search actions or items"}
          suffix={
            <Button
              onClick={() => close()}
              theme="invisible"
              data-tooltip="Close"
              icon={(p) => <XMarkIcon {...p} />}
              shortcut={["esc"]}
            />
          }
          shortcuts={["cmd+k"]}
          suggestions={[
            {
              type: "navigation",
              value: "Ouvrir 'Tous les contacts'",
              onClick: (event) => {
                navigateAlt(getRoute(ROUTES.Contacts), { event });
                close();
              },
            },
            {
              type: "navigation",
              value: "Ouvrir 'Clients'",
            },
            {
              type: "navigation",
              value: "Ouvrir 'Fournisseurs'",
            },
            {
              type: "navigation",
              value: "Ouvrir 'Devis'",
            },
          ]}
        />
      </div>
    </Modal>
  );
};
