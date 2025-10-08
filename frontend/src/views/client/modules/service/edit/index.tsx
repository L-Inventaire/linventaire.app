import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useClients } from "@features/clients/state/use-clients";
import { useParamsOrContextId } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { useServiceItemDefaultModel } from "@features/service/configuration";
import { ServiceItems, ServiceTimes } from "@features/service/types/types";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { useRest } from "@features/utils/rest/hooks/use-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SpentTime } from "../components/inline-spent-time-input";
import { ServiceItemsDetailsPage } from "../components/service-items-details";
import { getUrlModel } from "@components/search-bar/utils/as-model";

export const ServiceItemsEditPage = (_props: { readonly?: boolean }) => {
  const { refresh, loading } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParamsOrContextId();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const [spentTime, setSpentTime] = useState<SpentTime[]>([]);

  const defaultModel = useRef(useServiceItemDefaultModel()).current;
  const initialModel = getUrlModel<ServiceItems>();

  const { create: saveSpentTime } = useRest<ServiceTimes>("service_times");

  const { isInitiating, save, draft, remove, restore, isPendingModification } =
    useDraftRest<ServiceItems>(
      "service_items",
      id || "new",
      async (item) => {
        try {
          if (spentTime.length > 0) {
            // Add spend time also
            for (const spent of spentTime) {
              await saveSpentTime.mutateAsync({
                service: item.id,
                ...spent,
              });
            }
          }
        } catch (e) {
          console.log(e);
        }
        navigate(getRoute(ROUTES.ServiceItemsView, { id: item.id }));
      },
      _.omit(
        _.merge({}, defaultModel, initialModel),
        "reference"
      ) as ServiceItems
    );

  return (
    <Page
      loading={isPendingModification}
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
          onSaveDisabled={!draft.title || !draft.client}
          onSave={async () => {
            await save();
            navigate(getRoute(ROUTES.ServiceItems));
          }}
          onRemove={draft.id ? remove : undefined}
          onRestore={draft.id ? restore : undefined}
        />
      }
    >
      {isInitiating ? (
        <PageLoader />
      ) : (
        <ServiceItemsDetailsPage
          readonly={false}
          id={id}
          onChangeSpentTime={setSpentTime}
        />
      )}
    </Page>
  );
};
