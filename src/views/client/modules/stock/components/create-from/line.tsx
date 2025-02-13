import { FormInput } from "@components/form/fields";
import { RestDocumentsInput } from "@components/input-rest";
import { useArticle } from "@features/articles/hooks/use-articles";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { StockItems } from "@features/stock/types/types";
import { DocumentDuplicateIcon, TrashIcon } from "@heroicons/react/16/solid";
import { Heading, IconButton, Table } from "@radix-ui/themes";
import { useEffect } from "react";
import { InvoiceRestDocument } from "../../../invoices/components/invoice-lines-input/invoice-input-rest-card";
import { StockItemStatus } from "../stock-item-status";

export const StockItemLine = ({
  value,
  onChange,
  onRemove,
  onDuplicate,
  enforcedOrder,
}: {
  value: StockItems & { _key: string };
  onChange: (value: StockItems & { _key: string }) => void;
  onRemove: () => void;
  onDuplicate: (quantity?: number) => void;
  enforcedOrder?: string; // When a quote is predefined, then we allow to chose the supplier
}) => {
  const { article } = useArticle(value.article);
  const { invoice: quote } = useInvoice(value.for_rel_quote);
  const { invoice: supplierQuote } = useInvoice(value.from_rel_supplier_quote);

  // Reset location or client when changing state their are mutually exclusive
  useEffect(() => {
    if (value.state === "stock") {
      onChange({
        ...value,
        client: "",
      });
    } else {
      onChange({
        ...value,
        client: value.client || quote?.client || "",
        location: "",
      });
    }
  }, [value.state]);

  useEffect(() => {
    if (quote?.id && !value.quantity) {
      const matching = (quote.content || []).filter(
        (e) => e.article === value.article
      );
      const ready = matching.reduce(
        (acc, e) => acc + (e.quantity_ready || 0),
        0
      );
      const required = matching.reduce((acc, e) => acc + (e.quantity || 0), 0);
      onChange({
        ...value,
        quantity: required - ready || 1,
      });
    }
  }, [quote?.id]);

  return (
    <Table.Row align="center">
      <Table.Cell className="space-y-2">
        <Heading size="3">{article?.name}</Heading>
        <div className="flex space-x-2">
          <FormInput
            autoFocus
            label="Numéro de série ou de lot"
            type="text"
            placeholder="Numéro de série"
            value={value.serial_number}
            onChange={(e) => {
              onChange({ ...value, serial_number: e });
            }}
            onEnter={(e) => {
              const lotSize =
                article?.suppliers_details?.[supplierQuote?.supplier || ""]
                  ?.delivery_quantity || 1;
              // If enter is pressed, set the current line quantity to {lot size} and duplicate the line with the rest quantity
              // If there exactly {lot size} remaining, do nothing
              if (value.quantity > lotSize) {
                onChange({
                  ...value,
                  serial_number: e,
                  quantity: lotSize,
                });
                onDuplicate(value.quantity - lotSize);
              }
            }}
          />
          <FormInput
            className="max-w-24"
            label="Quantité"
            type="number"
            placeholder="Quantité"
            value={value.quantity}
            onChange={(e) => onChange({ ...value, quantity: e })}
          />
        </div>
      </Table.Cell>
      <Table.Cell className="min-w-64 space-y-2">
        {!enforcedOrder && (
          <InvoiceRestDocument
            size="xl"
            label="Commande"
            placeholder="Aucune affectation"
            value={value.from_rel_supplier_quote}
            onChange={(e: string, m: any) =>
              onChange({
                ...value,
                from_rel_supplier_quote: e,
                for_rel_quote: m?.for_rel_quote || "",
                state: m?.for_rel_quote ? value.state : "stock",
              })
            }
            filter={
              {
                "articles.all": value.article,
                type: "supplier_quotes",
              } as any
            }
          />
        )}
        {!!supplierQuote && (
          <InvoiceRestDocument
            size="xl"
            label="Devis"
            placeholder="Aucune affectation"
            value={value.for_rel_quote}
            onChange={(e: string) =>
              onChange({
                ...value,
                for_rel_quote: e,
                state: e ? value.state : "stock",
              })
            }
            filter={
              supplierQuote?.from_rel_quote
                ? {
                    id: supplierQuote?.from_rel_quote,
                  }
                : ({
                    "articles.all": value.article,
                    type: "quotes",
                  } as any)
            }
          />
        )}
      </Table.Cell>
      <Table.Cell>
        <StockItemStatus
          readonly={!value.for_rel_quote}
          value={value.state}
          onChange={(e) => onChange({ ...value, state: e })}
        />
        <div className="mt-2">
          {value.state === "stock" && (
            <RestDocumentsInput
              entity="stock_locations"
              size="xl"
              label="Localisation"
              placeholder="Aucune"
              value={value.location}
              onChange={(e) => onChange({ ...value, location: e })}
            />
          )}
          {value.state !== "stock" && (
            <RestDocumentsInput
              entity="contacts"
              size="xl"
              label="Chez le contact"
              placeholder="Aucun"
              filter={
                {
                  id: [quote?.client, quote?.contact],
                } as any
              }
              value={value.client}
              onChange={(e) => onChange({ ...value, client: e })}
            />
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex space-y-2 flex-col items-center">
          <IconButton variant="ghost" color="red" onClick={() => onRemove()}>
            <TrashIcon className="w-4 h-4" />
          </IconButton>
          <IconButton variant="ghost" onClick={() => onDuplicate()}>
            <DocumentDuplicateIcon className="w-4 h-4" />
          </IconButton>
        </div>
      </Table.Cell>
    </Table.Row>
  );
};
