import Link from "@atoms/link";
import { RestDocumentsInput } from "@components/input-rest";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { StockItems } from "@features/stock/types/types";
import { Heading, Table } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { QuotesCheckers, SerialNumberCheckers } from "./create-from/checkers";
import { StockItemLine } from "./create-from/line";

export const StockItemsCreateFromSupplier = ({
  onBack,
  supplier: id,
  onChange,
}: {
  onBack: () => void;
  supplier: string;
  onChange: (value: StockItems[]) => void;
}) => {
  const { contact: supplier, isPending } = useContact(id);

  const [stockItems, setStockItems] = useState<
    (StockItems & { _key: string })[]
  >([]);

  useEffect(() => {
    onChange(stockItems);
  }, [stockItems]);

  if (!supplier) {
    if (!isPending) onBack();
    return <></>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 mt-4">
      <div className="flex flex-row mb-2 items-center space-x-2">
        <Heading size="4">
          Réception à partir du fournisseur {getContactName(supplier!)}
        </Heading>
      </div>
      <Link onClick={() => onBack()}>
        Démarrer directement depuis une commande ?
      </Link>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Commande</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Localisation</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {stockItems.map((stockItem, index) => (
            <StockItemLine
              key={stockItem._key}
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
        placeholder={`Ajouter un article du fournisseur ${getContactName(
          supplier!
        )}`}
        value={""}
        filter={
          {
            suppliers: supplier.id,
          } as any
        }
        entity="articles"
        onChange={(e) => {
          setStockItems((stockItems) => {
            return [
              ...stockItems,
              {
                _key: Math.random().toString(),
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
