import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import { InputCounter } from "@atoms/input/input-counter";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Section, SectionSmall } from "@atoms/text";
import { withModel } from "@components/search-bar/utils/as-model";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { InvoicesApiClient } from "@features/invoices/api-client/invoices-api-client";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { formatAmount } from "@features/utils/format/strings";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Box, Separator, Spinner, Strong, Tabs, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { ModalHr, PageHr } from "@views/client/_layout/page";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const { draft } = useReadDraftRest<Invoices>("invoices", id || "new");

  const navigate = useNavigate();

  const { invoices } = useInvoices({
    query: buildQueryFromMap({
      from_rel_quote: [id],
    } as Partial<Invoices>),
  });

  const defaultContent = draft.content?.filter((a) => (a.quantity || 0) > 0);

  const [selection, setSelection] = useState<InvoiceLine[]>([]);

  useEffect(() => {
    if (defaultContent && selection.length === 0) {
      setSelection(defaultContent);
    }
  }, [defaultContent]);

  const partialInvoice = useQuery({
    queryKey: ["invoices", "partial", id, selection],
    queryFn: () => InvoicesApiClient.getPartialInvoice(draft, selection),
  });

  return (
    <ModalContent title="Créer une facture">
      <Tabs.Root
        defaultValue="complete"
        onValueChange={() => {
          setSelection(defaultContent || []);
        }}
      >
        <Tabs.List>
          <Tabs.Trigger value="complete">Facturer tout le reste</Tabs.Trigger>
          <Tabs.Trigger value="partial">Facture partielle</Tabs.Trigger>
        </Tabs.List>

        <Box pt="3">
          <Tabs.Content value="complete"></Tabs.Content>

          <Tabs.Content value="partial">
            {selection?.map((item, index) => (
              <div
                key={index}
                className="flex flex-row items-center space-x-2 my-1"
              >
                <div className="grow overflow-hidden">
                  <Checkbox
                    label={item.name}
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
                  max={defaultContent?.[index]?.quantity}
                  min={0}
                  value={item.quantity}
                  onChange={(e) =>
                    setSelection(
                      selection.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              quantity: Math.min(
                                defaultContent?.[index]?.quantity || 0,
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
        </Box>
      </Tabs.Root>

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
            {formatAmount(partialInvoice.data?.invoiced?.total?.total || 0)} HT
            déjà facturé.
            <br />
            {formatAmount(partialInvoice.data?.remaining?.total?.total || 0)} HT
            restant à facturer.
          </div>
        )}
      </div>

      <div className="text-right">
        <Button
          onClick={() => {
            navigate(
              withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                ...draft,
                from_rel_quote: [draft.id],
                type: "invoices",
                state: "draft",
                id: "",
                content: partialInvoice.data?.partial_invoice?.content?.filter(
                  (a) => a.type === "correction" || (a.quantity || 0) > 0
                ),
                discount: partialInvoice.data?.partial_invoice?.discount,
              })
            );
            onClose();
          }}
        >
          Créer la facture
        </Button>
      </div>
    </ModalContent>
  );
};
