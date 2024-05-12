import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { Orders } from "@features/orders/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { OrdersDetailsPage } from "../components/order-details";
import { PageLoader } from "@components/page-loader";

export const OrdersEditPage = ({ readonly }: { readonly?: boolean }) => {
  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const {
    draft: order,
    isPending,
    isInitiating,
    save,
  } = useDraftRest<Orders>(
    "orders",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.OrdersView, { id: item.id }));
    },
    {} as Orders
  );

  if (isInitiating) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Orders", to: getRoute(ROUTES.Orders) },
        { label: id ? "Modifier" : "Créer" },
      ]}
    >
      <div className="float-right space-x-2">
        <Button
          theme="outlined"
          onClick={async () =>
            navigate(
              !id
                ? getRoute(ROUTES.Orders)
                : getRoute(ROUTES.OrdersView, { id })
            )
          }
          size="sm"
        >
          Annuler
        </Button>
        <Button
          disabled={!order.articles?.length}
          loading={isPending}
          onClick={async () => await save()}
          size="sm"
        >
          Sauvegarder
        </Button>
      </div>
      {!id && <Title>Création de {order.reference || "<nouveau>"}</Title>}
      {id && <Title>Modification de {order.reference || ""}</Title>}
      <div className="mt-4" />
      <OrdersDetailsPage readonly={false} id={id} />
    </Page>
  );
};
