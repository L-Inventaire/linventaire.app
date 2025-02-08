import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useHasAccess } from "@features/access";
import { useParamsOrContextId } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { useServiceItem } from "@features/service/hooks/use-service-items";
import { Page } from "@views/client/_layout/page";
import { ServiceItemsDetailsPage } from "../components/service-items-details";

export const ServiceItemsViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParamsOrContextId();
  const {
    service_item: item,
    isPending,
    remove,
    restore,
    isPendingModification,
  } = useServiceItem(id || "");
  const hasAccess = useHasAccess();

  if (!item)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <PageLoader />
      </div>
    );

  return (
    <Page
      loading={isPendingModification}
      title={[
        { label: "Service", to: getRoute(ROUTES.ServiceItems) },
        { label: item.title || "" },
      ]}
      bar={
        <DocumentBar
          loading={isPending && !item}
          entity={"stock_items"}
          document={item || { id }}
          mode={"read"}
          backRoute={ROUTES.ServiceItems}
          editRoute={
            hasAccess("ONSITE_SERVICES_WRITE")
              ? ROUTES.ServiceItemsEdit
              : undefined
          }
          viewRoute={ROUTES.ServiceItemsView}
          prefix={<></>}
          suffix={<></>}
          onRemove={
            item?.id && hasAccess("ONSITE_SERVICES_WRITE")
              ? async () => remove.mutateAsync(item?.id)
              : undefined
          }
          onRestore={
            item?.id && hasAccess("ONSITE_SERVICES_WRITE")
              ? async () => restore.mutateAsync(item?.id)
              : undefined
          }
        />
      }
    >
      <ServiceItemsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
