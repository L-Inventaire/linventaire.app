import { RestDocumentsInput } from "@components/input-rest";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { StockItems } from "@features/stock/types/types";
import { Heading, Table } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { QuotesCheckers, SerialNumberCheckers } from "./create-from/checkers";
import { StockItemLine } from "./create-from/line";

export const StockItemsCreateFromOrder = ({
  onBack,
  order: id,
  onChange,
}: {
  onBack: () => void;
  order: string;
  onChange: (value: StockItems[]) => void;
}) => {
  const { invoice: order, isPending } = useInvoice(id);

  const [didPrefill, setDidPrefill] = useState(false);
  const [stockItems, setStockItems] = useState<
    (StockItems & { _key: string })[]
  >([]);

  useEffect(() => {
    onChange(stockItems);
  }, [stockItems]);

  // Prefill the stockItems with the quote content
  useEffect(() => {
    if (order && !didPrefill) {
      setDidPrefill(true);
      setStockItems(
        (order.content || [])
          .filter((e) => (e.quantity_ready || 0) < (e.quantity || 0))
          .map(
            (e) =>
              ({
                article: e.article,
                quantity: Math.max(
                  0,
                  (e.quantity || 0) - (e.quantity_ready || 0)
                ),
                from_rel_supplier_quote: order.id,
                for_rel_quote:
                  order.from_rel_quote?.length === 1
                    ? order.from_rel_quote?.[0]
                    : "",
                state: "stock",
                _key: Math.random().toString(),
              } as StockItems & { _key: string })
          )
      );
    }
  }, [order?.id]);

  if (!order) {
    if (!isPending) onBack();
    return <></>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 mt-4">
      <div className="flex flex-row mb-2 items-center space-x-2">
        <Heading size="4">
          Réception à partir de la commande {order.reference}
        </Heading>
      </div>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Devis</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Localisation</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {stockItems.map((stockItem, index) => (
            <StockItemLine
              key={stockItem._key}
              enforcedOrder={id}
              value={stockItem}
              onChange={(e) => {
                const newStockItems = [...stockItems];
                newStockItems[index] = e;
                setStockItems(newStockItems);
              }}
              onRemove={() =>
                setStockItems((stockItems) =>
                  stockItems.filter((item) => item._key !== stockItem._key)
                )
              }
              onDuplicate={() =>
                setStockItems((stockItems) => {
                  return [
                    ...stockItems.slice(0, index + 1),
                    {
                      ...stockItem,
                      serial_number: "",
                      quantity: 0,
                      _key: Math.random().toString(),
                    },
                    ...stockItems.slice(index + 1),
                  ];
                })
              }
            />
          ))}
        </Table.Body>
      </Table.Root>

      <RestDocumentsInput
        size="xl"
        label="Ajouter un article"
        placeholder={`Ajouter un article du devis ${order.reference}`}
        value={""}
        filter={
          {
            id: order.content?.map((e) => e.article),
          } as any
        }
        entity="articles"
        onChange={(e) => {
          setStockItems((stockItems) => {
            return [
              ...stockItems,
              {
                _key: Math.random().toString(),
                from_rel_supplier_quote: id,
                article: e,
                state: "stock",
                quantity: 1,
              } as StockItems & {
                _key: string;
              },
            ];
          });
        }}
      />

      <div className="space-y-2">
        <QuotesCheckers items={stockItems} />
        <SerialNumberCheckers items={stockItems} />
      </div>
    </div>
  );
};
