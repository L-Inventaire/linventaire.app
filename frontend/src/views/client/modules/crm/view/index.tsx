import { DocumentBar } from "@components/document-bar";
import { CRMItem } from "@features/crm/types/types";
import { useParamsOrContextId } from "@features/ctrlk";
import { getRoute, ROUTES } from "@features/routes";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import { CRMDetails } from "../components/crm-details";

export const CRMViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParamsOrContextId();
  const { draft: crmItem, isInitiating } = useReadDraftRest<CRMItem>(
    "crm_items",
    id || ""
  );

  return (
    <Page
      title={[{ label: "CRM", to: getRoute(ROUTES.CRM) }, { label: "Élément" }]}
      bar={
        <DocumentBar
          loading={isInitiating}
          entity={"crm_items"}
          document={crmItem}
          mode={"read"}
          editRoute={ROUTES.CRMEdit}
          viewRoute={ROUTES.CRMView}
          backRoute={ROUTES.CRMView}
        />
      }
    >
      <div className="mt-6" />
      {isInitiating ? <div /> : <CRMDetails readonly={true} id={id || ""} />}
    </Page>
  );
};
