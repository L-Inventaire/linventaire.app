import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { SectionSmall } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { withModel } from "@components/search-bar/utils/as-model";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { InvoicesApiClient } from "@features/invoices/api-client/invoices-api-client";
import { useInvoice, useInvoices } from "@features/invoices/hooks/use-invoices";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { formatAmount } from "@features/utils/format/strings";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  Box,
  Callout,
  Separator,
  Spinner,
  Strong,
  Tabs,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { atom, useRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";

export const InvoiceInvoiceModalAtom = atom<boolean>({
  key: "InvoiceInvoiceModalAtom",
  default: false,
});

export const InvoiceInvoiceModal = ({ id }: { id?: string }) => {
  const [open, setOpen] = useRecoilState(InvoiceInvoiceModalAtom);
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      {open && (
        <InvoiceInvoiceModalContent id={id} onClose={() => setOpen(false)} />
      )}
    </Modal>
  );
};

export const InvoiceInvoiceModalContent = ({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) => {
  const { invoice: quote } = useInvoice(id || "");

  const navigate = useNavigateAlt();

  const { invoices } = useInvoices({
    query: buildQueryFromMap({
      from_rel_quote: [id],
      type: "invoices",
    } as Partial<Invoices>),
  });

  const invoicedArticlesLines =
    invoices?.data?.list?.reduce(
      (acc, a) => acc.concat(a.content || []),
      [] as InvoiceLine[]
    ) || [];
  const invoicedArticlesMap = {} as Record<string, number>;
  for (const line of invoicedArticlesLines) {
    invoicedArticlesMap[line.article || ""] =
      (invoicedArticlesMap[line.article || ""] || 0) + (line.quantity || 0);
  }

  // Compute which articles are already invoiced and set a default content for each line of remaining articles
  const defaultContent = quote?.content
    ?.map((a) => {
      const invoicedQuantity = invoicedArticlesMap[a.article || ""] || 0;
      const quantity = Math.min(
        a.quantity_delivered || a.quantity || 0,
        Math.max(0, (a.quantity || 0) - invoicedQuantity)
      );
      invoicedArticlesMap[a.article || ""] -= quantity || 0;
      return {
        ...a,
        quantity_on_quote: a.quantity || 0,
        quantity_remaining_max: Math.max(
          0,
          (a.quantity || 0) - invoicedQuantity
        ),
        quantity,
      };
    })
    ?.filter((a) => (a.quantity || 0) > 0);

  const [selection, setSelection] = useState<
    (InvoiceLine & {
      quantity_on_quote: number;
      quantity_remaining_max: number;
    })[]
  >([]);

  useEffect(() => {
    if (
      quote &&
      defaultContent?.length &&
      selection.length === 0 &&
      invoices.isFetched
    ) {
      setSelection(defaultContent);
    }
  }, [defaultContent, selection, quote, invoices]);

  const partialInvoice = useQuery({
    queryKey: ["invoices", id, selection],
    queryFn: () =>
      quote ? InvoicesApiClient.getPartialInvoice(quote, selection) : undefined,
  });

  if (!quote || !defaultContent || !invoices.isFetched) return null;

  const hasntFilledQuoteLines =
    quote.type === "quotes" &&
    (selection || []).some(
      (a) =>
        a.quantity &&
        a.quantity > (a.quantity_delivered || 0) &&
        ["service", "product", "consumable"].includes(a.type)
    );

  return (
    <ModalContent title="Créer une facture">
      <Tabs.Root
        defaultValue={
          ((quote?.content || []).some((a) => a.subscription) &&
            defaultContent?.length) ||
          hasntFilledQuoteLines
            ? "partial"
            : "complete"
        }
        onValueChange={(mode) => {
          setSelection(
            mode === "complete"
              ? (defaultContent || []).map((a) => ({
                  ...a,
                  quantity: a.quantity_remaining_max,
                }))
              : mode === "down_payment"
              ? [
                  {
                    type: "correction",
                    name: "Acompte",
                    quantity: 1,
                    quantity_on_quote: 0,
                    quantity_remaining_max: 1,
                    unit_price: 0,
                  },
                ]
              : defaultContent || []
          );
        }}
      >
        <Tabs.List>
          <Tabs.Trigger value="complete">Tout facturer</Tabs.Trigger>
          {!!defaultContent?.length && (
            <Tabs.Trigger value="partial">Facture partielle</Tabs.Trigger>
          )}
          <Tabs.Trigger value="down_payment">Acompte</Tabs.Trigger>
        </Tabs.List>

        <Box pt="3">
          <Tabs.Content value="complete"></Tabs.Content>

          <Tabs.Content value="partial">
            {selection?.map((item, index) => (
              <div
                key={index}
                className="flex flex-row items-center space-x-2 my-1"
              >
                <div className="grow overflow-hidden min-w-0">
                  <Checkbox
                    label={
                      item.name +
                      ` (${item.quantity_delivered} livré / ${item.quantity_on_quote})`
                    }
                    value={!!item.quantity}
                    onChange={(e) =>
                      setSelection(
                        selection.map((s, i) =>
                          i === index
                            ? {
                                ...s,
                                quantity: e
                                  ? defaultContent?.[i]?.quantity
                                  : 0 || 0,
                              }
                            : s
                        )
                      )
                    }
                  />
                </div>
                <Input
                  placeholder="Quantity"
                  type="number"
                  size="md"
                  className={twMerge(
                    "w-24 shrink-0",
                    !item.quantity && "opacity-50"
                  )}
                  max={defaultContent?.[index]?.quantity_remaining_max}
                  min={0}
                  value={item.quantity}
                  onChange={(e) =>
                    setSelection(
                      selection.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              quantity: Math.min(
                                defaultContent?.[index]
                                  ?.quantity_remaining_max || 0,
                                Math.max(0, +e.target.value)
                              ),
                            }
                          : s
                      )
                    )
                  }
                />
              </div>
            ))}
            <Separator size="4" className="my-4" />
          </Tabs.Content>

          <Tabs.Content value="down_payment">
            <Text>Entrez l'acompte souhaité.</Text>
            <FormInput
              type="formatted"
              format="price"
              size="md"
              placeholder="0.00 €"
              className="w-full mb-4 mt-2"
              value={selection[0]?.unit_price || 0}
              onChange={(e) => {
                setSelection([
                  {
                    ...selection[0],
                    unit_price: e,
                    quantity: 1, // A down payment is usually a single line
                  },
                ]);
              }}
            />
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {(partialInvoice.data?.partial_invoice?.total?.total || 0) === 0 && (
        <>
          <Callout.Root>
            <Callout.Text>Aucune facture à générer.</Callout.Text>
          </Callout.Root>
          <div className="text-right mt-4">
            <Button
              theme="outlined"
              onClick={(event: any) => {
                navigate(
                  getRoute(ROUTES.Invoices, { type: "invoices" }) +
                    `?q=from_rel_quote:"${quote?.id}"`,
                  {
                    event,
                  }
                );
                onClose();
              }}
            >
              Consulter les factures de ce devis
            </Button>
          </div>
        </>
      )}

      <AnimatePresence>
        {hasntFilledQuoteLines && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Callout.Root color="red" className="mb-4">
              <Text>
                <b>Attention!</b> Au moins une ligne de ce devis n'est pas
                entièrement livrée ou effectuée et va être facturée.
              </Text>
            </Callout.Root>
          </motion.div>
        )}
      </AnimatePresence>

      {partialInvoice.isPending ||
        ((partialInvoice.data?.partial_invoice?.total?.total || 0) > 0 && (
          <>
            <SectionSmall>Facture à générer</SectionSmall>
            <div>
              {partialInvoice.isPending && <Spinner />}

              {!partialInvoice.isPending && (
                <div>
                  <Strong>
                    {formatAmount(
                      partialInvoice.data?.partial_invoice?.total?.total || 0
                    )}{" "}
                    HT sur cette facture.
                  </Strong>
                  <br />
                  {formatAmount(
                    partialInvoice.data?.invoiced?.total?.total || 0
                  )}{" "}
                  HT déjà facturé.
                  <br />
                  {formatAmount(
                    partialInvoice.data?.remaining?.total?.total || 0
                  )}{" "}
                  HT restera à facturer.
                </div>
              )}
            </div>

            <div className="text-right">
              <Button
                onClick={() => {
                  navigate(
                    withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                      ..._.omit(
                        quote,
                        "id",
                        "emit_date",
                        "reference_preferred_value"
                      ),
                      from_rel_quote: [quote?.id],
                      type: "invoices",
                      state: "draft",
                      content:
                        partialInvoice.data?.partial_invoice?.content?.filter(
                          (a) =>
                            a.type === "correction" || (a.quantity || 0) > 0
                        ),
                      discount: partialInvoice.data?.partial_invoice?.discount,
                    } as Partial<Invoices>)
                  );
                  onClose();
                }}
              >
                Créer la facture
              </Button>
            </div>
          </>
        ))}
    </ModalContent>
  );
};
