import { FormInput } from "@/components/form/fields";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { useStockItems } from "@features/stock/hooks/use-stock-items";
import { StockItems } from "@features/stock/types/types";
import { Badge, Callout, Heading } from "@radix-ui/themes";
import _ from "lodash";
import { useEffect, useState } from "react";

// This one checks that the serial numbers are not already used
export const SerialNumberCheckers = ({
  items,
  onChangeAllowDuplicates,
}: {
  items: StockItems[];
  onChangeAllowDuplicates?: (allow?: boolean) => void;
}) => {
  const serialNumbers = items.map((e) => e.serial_number);
  const articles = items.map((e) => e.article);

  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);

  const filledSerialNumbers = serialNumbers.filter(Boolean);
  const { stock_items: _existingSerialNumbers } = useStockItems({
    query: [
      ...buildQueryFromMap({
        serial_number: [...filledSerialNumbers],
        article: articles,
      }),
      {
        key: "quantity",
        values: [
          {
            op: "gte",
            value: 1,
          },
        ],
      },
    ],
    limit: filledSerialNumbers.length ? undefined : 0,
  });

  // Remove ourselves in case of update
  const existingSerialNumbers = _existingSerialNumbers?.data?.list?.filter(
    (e) => !items.map((a) => a.id).includes(e.id)
  );

  const duplicatesInForm =
    filledSerialNumbers.length > new Set(filledSerialNumbers).size;
  const duplicatesInStock = (existingSerialNumbers?.length || 0) > 0;

  useEffect(() => {
    onChangeAllowDuplicates?.(allowDuplicates);
  }, [allowDuplicates]);

  useEffect(() => {
    setAllowDuplicates(false);
  }, [duplicatesInStock, duplicatesInForm]);

  return (
    <>
      {serialNumbers.filter((e) => !e)?.length > 1 && (
        <Callout.Root color="orange">
          {serialNumbers.filter((e) => !e)?.length} éléments n'ont pas de numéro
          de série.
        </Callout.Root>
      )}

      {serialNumbers.filter((e) => !e)?.length === 1 && (
        <Callout.Root color="orange">
          1 élément n'a pas de numéro de série.
        </Callout.Root>
      )}

      {duplicatesInForm && (
        <Callout.Root color="orange">
          Attention certain éléments possèdent un numéro de série en double.
        </Callout.Root>
      )}

      {duplicatesInStock && (
        <Callout.Root color="red">
          Les numéros de série suivants existent déjà dans le stock :{" "}
          {existingSerialNumbers?.map((e) => e.serial_number).join(", ")}
        </Callout.Root>
      )}

      {!!onChangeAllowDuplicates &&
        ((existingSerialNumbers?.length || 0) > 0 ||
          filledSerialNumbers.length > new Set(filledSerialNumbers).size) && (
          <>
            <FormInput
              type="boolean"
              value={allowDuplicates}
              onChange={(value) => {
                setAllowDuplicates(value);
              }}
              placeholder="Importer tout de même les doublons."
            />
          </>
        )}
    </>
  );
};

// This one checks that the quotes wont have too many items after adding/updating the stock items
export const QuotesCheckers = ({ items }: { items: StockItems[] }) => {
  // An initial quantity used for the checkers to detect diffs between the initial and the final state
  const [initialQuantities, setInitialItemsValues] = useState<
    { id: string; quantity: number }[]
  >([]);
  useEffect(() => {
    if (!initialQuantities.length) {
      setInitialItemsValues([
        ...items
          .filter((a) => a.id)
          .map((a) => ({ id: a.id, quantity: a.quantity })),
      ]);
    }
  }, [items?.length]);

  const quotesIds = _.uniq(items.map((e) => e.for_rel_quote).filter(Boolean));
  const { invoices: quotes } = useInvoices({
    query: buildQueryFromMap({
      id: quotesIds,
    }),
    limit: quotesIds?.length,
  });

  const orderIds = _.uniq(
    items.map((e) => e.from_rel_supplier_quote).filter(Boolean)
  );
  const { invoices: orders } = useInvoices({
    query: buildQueryFromMap({
      id: orderIds,
    }),
    limit: orderIds?.length,
  });

  // Compute if any order or quote will be overflooding

  const overflooding: {
    [key: string]: {
      [docId: string]: {
        articles: {
          article: InvoiceLine;
          added: number;
          ready: number;
          remaining: number;
          total: number;
        }[];
        doc: Invoices;
      };
    };
  } = {
    quotes: {},
    orders: {},
  };
  for (const type of ["quotes", "orders"]) {
    const documents = type === "quotes" ? quotes : orders;
    const grouped = Object.values(
      _.groupBy(
        items,
        (a) =>
          a.article +
          "_" +
          (type === "quotes" ? a.for_rel_quote : a.from_rel_supplier_quote)
      )
    );
    for (const items of grouped) {
      const doc = documents?.data?.list?.find(
        (e) =>
          e.id ===
          (type === "quotes"
            ? items[0].for_rel_quote
            : items[0].from_rel_supplier_quote)
      );
      if (doc) {
        const articles = doc?.content?.filter(
          (e) => e.article === items[0].article
        );
        if (articles?.[0]) {
          const total =
            articles?.reduce((acc, e) => (e.quantity || 0) + acc, 0) || 0;
          const ready =
            (articles?.reduce((acc, e) => (e.quantity_ready || 0) + acc, 0) ||
              0) -
            // We remove previous value and keep only the diff
            (initialQuantities.find((e) => e.id === items[0].id)?.quantity ||
              0);
          const remaining = total - ready;
          const added = items.reduce(
            (acc, e) => parseInt((e.quantity || "0") as string) + acc,
            0
          );

          if (added > remaining) {
            overflooding[type][doc.id] = overflooding[type][doc.id] || {
              doc,
              articles: [],
            };
            overflooding[type][doc.id].articles.push({
              article: articles?.[0],
              added,
              ready,
              remaining,
              total,
            });
          }
        }
      }
    }
  }

  return (
    <>
      {false && items.filter((e) => !e.from_rel_supplier_quote)?.length > 0 && (
        <Callout.Root>
          Au moins un élément n'est pas associé à une commande.
        </Callout.Root>
      )}

      {false && items.filter((e) => !e.for_rel_quote)?.length > 0 && (
        <Callout.Root>
          Au moins un élément n'est pas associé à un devis.
        </Callout.Root>
      )}

      {Object.keys(overflooding.quotes).length > 0 && (
        <Callout.Root color="red">
          Certain devis auront un nombre incorrect d'éléments associés une fois
          la mise à jour terminée:
          {Object.values(overflooding.quotes).map((e) => (
            <div>
              <Heading size="3">{e.doc.reference}</Heading>
              {
                <div>
                  {e.articles.map((a) => (
                    <div>
                      <Heading size="2" className="inline">
                        {a.article.name}
                      </Heading>
                      : <Badge>{a.remaining}</Badge> en attente mais{" "}
                      <Badge>{a.added}</Badge> seront ajoutés
                    </div>
                  ))}
                </div>
              }
            </div>
          ))}
        </Callout.Root>
      )}

      {Object.keys(overflooding.orders).length > 0 && (
        <Callout.Root color="red">
          Certaines commandes auront un nombre incorrect d'éléments associés une
          fois la mise à jour terminée:
          {Object.values(overflooding.orders).map((e) => (
            <div>
              <Heading size="3">{e.doc.reference}</Heading>
              {
                <div>
                  {e.articles.map((a) => (
                    <div>
                      <Heading size="2" className="inline">
                        {a.article.name}
                      </Heading>
                      : <Badge>{a.remaining}</Badge> en attente mais{" "}
                      <Badge>{a.added}</Badge> seront ajoutés
                    </div>
                  ))}
                </div>
              }
            </div>
          ))}
        </Callout.Root>
      )}
    </>
  );
};
