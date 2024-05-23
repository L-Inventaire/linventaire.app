import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { PageLoader } from "@components/page-loader";
import { useOrder } from "@features/orders/hooks/use-orders";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { OrdersDetailsPage } from "../components/order-details";

export const OrdersViewPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();
  const { order } = useOrder(id || "");
  const navigate = useNavigate();

  if (!order) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Orders", to: getRoute(ROUTES.Orders) },
        { label: order.reference || "" },
      ]}
    >
      <div className="float-right space-x-2">
        <Button
          size="sm"
          onClick={async () => navigate(getRoute(ROUTES.OrdersEdit, { id }))}
        >
          Modifier
        </Button>
      </div>
      <Title>{order.reference || ""}</Title>
      <div className="mt-4" />
      <OrdersDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
