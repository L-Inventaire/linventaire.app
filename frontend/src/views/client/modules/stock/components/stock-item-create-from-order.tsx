import { Info } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useInvoice, useInvoices } from "@features/invoices/hooks/use-invoices";
import { StockItems } from "@features/stock/types/types";
import { Heading, Table } from "@radix-ui/themes";
import _ from "lodash";
import { useEffect, useState } from "react";
import { QuotesCheckers, SerialNumberCheckers } from "./create-from/checkers";
import { StockItemLine } from "./create-from/line";

export const StockItemsCreateFromOrder = ({
  onBack,
  order: id,
  onChange,
  loading,
}: {
  onBack: () => void;
  order: string;
  onChange: (value: StockItems[]) => void;
  loading: boolean;
}) => {
  const { invoice: order, isPending } = useInvoice(id);
  const { invoices: quotes } = useInvoices({
    query: buildQueryFromMap({
      id: order?.from_rel_quote || [],
    }),
    limit: order?.from_rel_quote?.length || 0,
  });
  const quoteIsPending = quotes.isPending;

  const [didPrefill, setDidPrefill] = useState(false);
  const [stockItems, setStockItems] = useState<
    (StockItems & { _key: string })[]
  >([]);

  useEffect(() => {
    onChange(stockItems);
  }, [stockItems]);

  // Prefill the stockItems with the quote content
  useEffect(() => {
    if (
      order &&
      !didPrefill &&
      (quotes?.data?.total || !order.from_rel_quote?.length)
    ) {
      let counter = 0;
      setDidPrefill(true);
      const quotesCopy = _.cloneDeep(quotes?.data?.list || []);
      const t =
        (order.content || [])
          .filter((e) => (e.quantity_ready || 0) < (e.quantity || 0))
          .map((e) => {
            let quantityInQuotes = 0;

            const quotesValues = quotesCopy.map((q) => {
              counter++;
              let quoteQuantity = (q.content || [])
                .filter((a) => a.article === e.article)
                .reduce((acc, e) => acc + (e.quantity || 0), 0);
              const toDefineQuantity =
                (e.quantity || 0) - (e.quantity_ready || 0) - quantityInQuotes;
              quoteQuantity = Math.min(toDefineQuantity, quoteQuantity);
              quantityInQuotes += quoteQuantity;
              return {
                article: e.article,
                quantity: Math.max(0, quoteQuantity),
                from_rel_supplier_quote: order.id,
                for_rel_quote: q.id,
                state: "stock",
                _key: Math.random().toString() + counter,
              };
            });
            counter++;

            const stockQuantity =
              (e.quantity || 0) - (e.quantity_ready || 0) - quantityInQuotes;

            // Remove them from the quote
            return [
              ...quotesValues,
              {
                article: e.article,
                quantity: Math.max(0, stockQuantity),
                from_rel_supplier_quote: order.id,
                for_rel_quote: "",
                state: "stock",
                _key: Math.random().toString() + counter,
              },
            ].filter((e) => e.quantity > 0);
          })
          .reduce((acc, val) => acc.concat(val), []) || [];
      setStockItems(t as (StockItems & { _key: string })[]);
    }
  }, [order?.id, quotes?.data?.total]);

  if (!order) {
    if (!isPending && !quoteIsPending) onBack();
    return <></>;
  }

  if (order?.from_rel_quote?.length && !quotes?.data?.total && quoteIsPending) {
    return <></>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 mt-4">
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
                setStockItems((stockItems) => {
                  const newStockItems = [...stockItems];
                  newStockItems[index] = e;
                  return newStockItems;
                });
              }}
              onRemove={() =>
                setStockItems((stockItems) =>
                  stockItems.filter((item) => item._key !== stockItem._key)
                )
              }
              onDuplicate={(quantity = 1) =>
                setStockItems((stockItems) => {
                  return [
                    ...stockItems.slice(0, index + 1),
                    {
                      ...stockItem,
                      serial_number: "",
                      quantity,
                      _key: Math.random().toString() + Date.now(),
                    },
                    ...stockItems.slice(index + 1),
                  ];
                })
              }
            />
          ))}
        </Table.Body>
      </Table.Root>

      <QuantityCallout />

      <RestDocumentsInput
        size="xl"
        label="Ajouter un article"
        placeholder={`Ajouter un article de la commande ${order.reference}`}
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

      {!loading && (
        <div className="space-y-2">
          <QuotesCheckers items={stockItems} />
          <SerialNumberCheckers
            items={stockItems}
            onChangeAllowDuplicates={(allow) => {
              setStockItems((stockItems) =>
                stockItems.map((item) => ({
                  ...item,
                  _allow_duplicate_serial_number: allow,
                }))
              );
            }}
          />
        </div>
      )}
    </div>
  );
};

export const QuantityCallout = () => (
  <Info className="block">
    Presser "Entrée" dans le champ "Numéro de série ou de lot" permet de
    dupliquer la ligne en réduisant la quantité.
  </Info>
);
