import { DocumentBar } from "@components/document-bar";
import { getUrlModel } from "@components/search-bar/utils/as-model";
import { useCRMDefaultModel } from "@features/crm/configuration";
import { CRMItem } from "@features/crm/types/types";
import { useParamsOrContextId } from "@features/ctrlk";
import { getRoute, ROUTES } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { CRMDetails } from "../components/crm-details";

export const CRMEditPage = (_props: { readonly?: boolean }) => {
  let { id } = useParamsOrContextId();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useRef(useCRMDefaultModel()).current;
  const initialModel = getUrlModel<CRMItem>();

  const {
    draft: crmItem,
    save,
    isInitiating,
    remove,
    restore,
    isPendingModification,
  } = useDraftRest<CRMItem>(
    "crm_items",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.CRMView, { id: item.id }));
    },
    _.merge({}, defaultModel, initialModel) as CRMItem
  );

  return (
    <Page
      loading={isPendingModification}
      title={[{ label: "CRM", to: getRoute(ROUTES.CRM) }, { label: "Élément" }]}
      bar={
        <DocumentBar
          loading={isInitiating}
          entity={"crm_items"}
          document={crmItem}
          mode={"write"}
          onSave={async () => {
            if (!crmItem?.notes) {
              toast.error("Vous devez saisir le nom de l'opportunité.");
              return;
            }
            await save();
          }}
          prefix={<span>Créer une opportunité</span>}
          onRemove={crmItem.id ? remove : undefined}
          onRestore={crmItem.id ? restore : undefined}
        />
      }
    >
      <div className="mt-6" />
      {isInitiating ? <div /> : <CRMDetails readonly={false} id={id} />}
    </Page>
  );
};
