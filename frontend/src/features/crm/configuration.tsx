import {
  ContextId,
  CtrlkAction,
  registerCtrlKRestEntity,
} from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { CRMDetails } from "@views/client/modules/crm/components/crm-details";
import { CRMEditPage } from "@views/client/modules/crm/edit";
import { CRMViewPage } from "@views/client/modules/crm/view";
import { CRMItem } from "./types/types";
import { setDefaultRestActions } from "../utils/rest/utils";

export const useCRMDefaultModel: () => Partial<CRMItem> = () => ({
  title: "",
  amount: 0,
  contacts: [],
  notes: "",
  state: "new",
  assigned: [],
  tags: [],
});

export const CRMFieldsNames = () => ({
  title: "Titre",
  amount: "Montant",
  contacts: "Contacts",
  notes: "Notes",
  state: "Status",
  assigned: "Assignés",
  tags: "Tags",
  seller: "Vendeur",
});

export const CRMEditor = ({
  id,
  readonly,
}: {
  id: string;
  readonly?: boolean;
}) => {
  return <CRMDetails id={id} readonly={readonly} />;
};

registerCtrlKRestEntity<CRMItem>("crm_items", {
  renderResult: [
    {
      id: "title",
      title: "Titre",
      render: (item) => item.notes || "-",
    },
    {
      id: "seller",
      title: "Vendeur",
      render: (item) => item.seller,
    },
    {
      id: "state",
      title: "Status",
      render: (item) => item.state,
    },
  ],
  renderPage: (props) => (
    <ContextId.Provider value={props.id}>
      {props.readonly ? <CRMViewPage /> : <CRMEditPage />}
    </ContextId.Provider>
  ),
  renderEditor: CRMEditor,
  viewRoute: ROUTES.CRMView,
  actions: (rows, queryClient) => {
    const actions: CtrlkAction[] = [];
    setDefaultRestActions(actions, "crm_items", rows, queryClient);
    return actions;
  },
});
