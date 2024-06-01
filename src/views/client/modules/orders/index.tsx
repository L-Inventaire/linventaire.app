import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { Table } from "@components/table";
import { TagsInput } from "@components/tags-input";
import { useOrders } from "@features/orders/hooks/use-orders";
import { Orders } from "@features/orders/types/types";
import { ROUTES, getRoute } from "@features/routes";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";

export const OrdersPage = () => {
  const [options, setOptions] = useState<RestOptions<Orders>>({
    limit: 10,
    offset: 0,
    query: [],
  });
  const { orders } = useOrders(options);
  const schema = useRestSchema("orders");

  return (
    <Page
      title={[{ label: "Orders" }]}
      bar={
        <SearchBar
          schema={{
            table: "orders",
            fields: schemaToSearchFields(schema.data, {
              tags: {
                label: "Étiquettes",
                keywords: "tags étiquettes label",
              },
              updated_at: "Date de mise à jour",
              updated_by: {
                label: "Mis à jour par",
                keywords: "updated_by mis à jour par auteur utilisateur user",
              },
              email: "Email",
              phone: "Téléphone",
              is_supplier: "Fournisseur",
              is_client: "Client",
            }),
          }}
          onChange={(q) =>
            q.valid && setOptions({ ...options, query: q.fields })
          }
          suffix={
            <Button
              size="xs"
              to={getRoute(ROUTES.OrdersEdit, { id: "new" })}
              icon={(p) => <PlusIcon {...p} />}
            >
              Créer une commande
            </Button>
          }
        />
      }
    >
      <div className="mb-4" />

      <Table
        loading={orders.isPending}
        data={orders?.data?.list || []}
        total={orders?.data?.total || 0}
        showPagination="full"
        rowIndex="id"
        onSelect={(items) => false && console.log(items)}
        onRequestData={async (page) => {
          setOptions({
            ...options,
            limit: page.perPage,
            offset: (page.page - 1) * page.perPage,
            asc: page.order === "ASC",
            index:
              page.orderBy === undefined
                ? undefined
                : [
                    "business_name,person_first_name,person_last_name,business_registered_name",
                    "tags",
                  ][page.orderBy],
          });
        }}
        columns={[
          {
            title: "Name",
            orderable: true,
            render: (order) => order.reference,
          },
          {
            title: "Orders",
            orderable: true,
            render: (order) => <Info>z</Info>,
          },
          {
            title: "Tags",
            orderable: true,
            render: (order) => <TagsInput value={order.tags} disabled />,
          },
          {
            title: "Actions",
            thClassName: "w-1",
            render: ({ id }) => (
              <>
                <Button size="sm" to={getRoute(ROUTES.OrdersView, { id })}>
                  View
                </Button>
              </>
            ),
          },
        ]}
      />
    </Page>
  );
};
