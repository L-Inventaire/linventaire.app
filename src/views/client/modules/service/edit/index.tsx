import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";
import { useServiceItemDefaultModel } from "@features/service/configuration";
import { ServiceItems } from "@features/service/types/types";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ServiceItemsDetailsPage } from "../components/service-items-details";

export const ServiceItemsEditPage = (_props: { readonly?: boolean }) => {
  const { refresh, loading } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useServiceItemDefaultModel();
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as ServiceItems;

  const { isInitiating, save } = useDraftRest<ServiceItems>(
    "service_items",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.ServiceItemsView, { id: item.id }));
    },
    _.omit(_.merge(defaultModel, initialModel), "reference") as ServiceItems
  );

  return (
    <Page
      title={[
        { label: "Service", to: getRoute(ROUTES.ServiceItems) },
        { label: id ? "Modifier" : "Créer" },
      ]}
      bar={
        <DocumentBar
          loading={isInitiating || loading}
          entity={"stock_items"}
          document={{ id }}
          mode={"write"}
          onSave={async () => await save()}
          backRoute={ROUTES.ServiceItems}
          viewRoute={ROUTES.ServiceItemsView}
          editRoute={ROUTES.ServiceItemsEdit}
        />
      }
    >
      {isInitiating ? (
        <PageLoader />
      ) : (
        <ServiceItemsDetailsPage readonly={false} id={id} />
      )}
    </Page>
  );
};
