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
import { RestFieldsNames } from "../utils/rest/configuration";
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
  ...RestFieldsNames(),
  contacts: {
    label: "Clients",
    keywords: "clients contacts",
  },
  notes: {
    label: "Description",
    keywords: "description notes",
  },
  state: {
    label: "Statut",
    keywords: "statut état status",
  },
  seller: {
    label: "Vendeur",
    keywords: "vendeur commercial",
  },
  assigned: {
    label: "Assignés",
    keywords: "utilisateurs assignés",
  },
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
