import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { ServiceItemsDetailsPage } from "@views/client/modules/service/components/service-items-details";
import { ServiceTimesDetailsPage } from "@views/client/modules/service/components/service-times-details";
import { ServiceItems, ServiceTimes } from "./types/types";

export const useServiceItemDefaultModel: () => Partial<ServiceItems> =
  () => ({});

registerCtrlKRestEntity<ServiceItems>("service_items", {
  renderEditor: (props) => (
    <ServiceItemsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: (item) => <>{item.article}</>,
  useDefaultData: useServiceItemDefaultModel,
  viewRoute: ROUTES.ServiceItemsView,
});

export const useServiceTimeDefaultModel: () => Partial<ServiceTimes> =
  () => ({});

registerCtrlKRestEntity<ServiceTimes>("service_items", {
  renderEditor: (props) => (
    <ServiceTimesDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: (item) => <>{item.date}</>,
  useDefaultData: useServiceTimeDefaultModel,
  viewRoute: ROUTES.ServiceItemsView,
});
