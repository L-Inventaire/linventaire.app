import { AnimatedHeight } from "@atoms/animated-side/height";
import { Button } from "@atoms/button/button";
import { Card } from "@atoms/card";
import { Info } from "@atoms/text";
import { FormContextContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { FilesInput } from "@components/input-rest/files";
import { Invoices } from "@features/invoices/types/types";
import { formatAmount } from "@features/utils/format/strings";
import {
  PaperClipIcon,
  PlusIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/20/solid";
import { Box, Flex, Heading, Card as RadixCard } from "@radix-ui/themes";
import _ from "lodash";
import { Fragment, useContext, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { InvoiceDiscountInput } from "./components/discount-input";
import { InvoiceTotalCard } from "./components/invoice-total-card";
import { DropInvoiceLine, InvoiceLineInput } from "./invoice-line-input";

export const InvoiceLinesInput = ({
  onChange,
  value,
  ...props
}: {
  onChange: (v: Invoices) => void;
  value: Invoices;
  readonly?: boolean;
  hideAttachments?: boolean;
  hideDiscount?: boolean;
}) => {
  const formContext = useContext(FormContextContext);
  const readonly = props.readonly ?? formContext.readonly;

  const refTriggerUploadFile = useRef<() => void>(() => {});
  const addLine = () => {
    onChange({
      ...value,
      content: [
        ...(value.content || []),
        {
          _id: _.uniqueId(),
          type: "product",
          name: "",
          description: "",
          unit: "",
          unit_price: 0,
          quantity: 1,
        },
      ],
    });
  };

  return (
    <>
      <div
        className={twMerge(
          "relative flex w-full items-center opacity-100 mb-3 transition-all group/invoice-line"
        )}
      >
        <RadixCard
          variant="ghost"
          className={twMerge("w-full p-0 border m-0 dark:border-slate-700")}
        >
          <Flex direction="column">
            <Flex align="stretch">
              <Box flexGrow="1">
                <Heading size={"2"} className="py-1 px-2.5">
                  Article
                </Heading>
              </Box>
              <Box className={twMerge("text-right w-1/6 shrink-0")}>
                <Heading size={"2"} className="py-1 px-2.5">
                  Réf. Fournisseur
                </Heading>
              </Box>
              <Box
                className={twMerge(
                  "text-right w-1/6 shrink-0 border-l dark:border-slate-700"
                )}
              >
                <Heading size={"2"} className="py-1 px-2.5">
                  Quantité
                </Heading>
              </Box>
              <Box
                className={twMerge(
                  "text-right w-1/6 shrink-0 border-l dark:border-slate-700"
                )}
              >
                <Heading size={"2"} className="py-1 px-2.5">
                  Prix U.
                </Heading>
              </Box>
              <Box
                className={twMerge(
                  "text-right w-1/5 shrink-0 border-l dark:border-slate-700"
                )}
              >
                <Heading size={"2"} className="py-1 px-2.5">
                  Résumé HT
                </Heading>
              </Box>
            </Flex>
          </Flex>
        </RadixCard>
      </div>

      <Card
        show={!(value.content || []).length}
        className="text-center"
        title="Insérez une première ligne"
      >
        Votre facture ne contient aucune ligne, ajoutez-en une pour continuer.
        <br />
        {!readonly && (
          <Button
            className="my-2"
            theme="outlined"
            size="sm"
            icon={(p) => <PlusIcon {...p} />}
            onClick={addLine}
          >
            Ajouter une ligne
          </Button>
        )}
      </Card>

      <div className="mb-2">
        {value.content?.map((line, index) => (
          <Fragment key={line._id}>
            {index === 0 && (
              <DropInvoiceLine
                onMove={(item) =>
                  onChange({
                    ...value,
                    content: [
                      item,
                      ...(value.content || []).filter(
                        (a) => a._id !== item._id
                      ),
                    ],
                  })
                }
              />
            )}
            <InvoiceLineInput
              invoice={value}
              ctrl={{
                onChange: (line) =>
                  onChange({
                    ...value,
                    content: value.content?.map((a) =>
                      a._id === line._id ? line : a
                    ),
                  }),
                value: line,
              }}
              onRemove={() => {
                onChange({
                  ...value,
                  content: value.content?.filter((a) => a._id !== line._id),
                });
              }}
              onDuplicate={() => {
                // Add item just after the current one
                const content = _.cloneDeep(value.content || []);
                const index = content.findIndex((a) => a._id === line._id);
                content.splice(index + 1, 0, {
                  ...line,
                  _id: _.uniqueId(),
                });
                onChange({
                  ...value,
                  content,
                });
              }}
              onMoveUp={
                index === 0
                  ? undefined
                  : () => {
                      // Swap with previous item
                      const content = _.cloneDeep(value.content || []);
                      const index = content.findIndex(
                        (a) => a._id === line._id
                      );
                      if (index === 0) return;
                      const item = content[index];
                      content[index] = content[index - 1];
                      content[index - 1] = item;
                      onChange({
                        ...value,
                        content,
                      });
                    }
              }
              onMoveDown={
                index === (value.content || []).length - 1
                  ? undefined
                  : () => {
                      // Swap with next item
                      const content = _.cloneDeep(value.content || []);
                      const index = content.findIndex(
                        (a) => a._id === line._id
                      );
                      if (index === content.length - 1) return;
                      const item = content[index];
                      content[index] = content[index + 1];
                      content[index + 1] = item;
                      onChange({
                        ...value,
                        content,
                      });
                    }
              }
            />
            <DropInvoiceLine
              onMove={(item) => {
                if (item._id === line._id) return;
                // Place item after line
                const content = _.cloneDeep(value.content || []).filter(
                  (a) => a._id !== item._id
                );
                const index = content.findIndex((a) => a._id === line._id);
                content.splice(index + 1, 0, item);
                onChange({
                  ...value,
                  content,
                });
              }}
            />
          </Fragment>
        ))}
      </div>

      {!props.hideAttachments && (
        <AnimatedHeight className="text-left">
          {!!value?.attachments?.length && (
            <Info>
              Pièces jointes au document et visible par le destinataire
            </Info>
          )}
          <div>
            <FilesInput
              ctrl={{
                value: value.attachments,
                onChange: (attachments) => onChange({ ...value, attachments }),
              }}
              rel={{
                table: "invoices",
                id: value.id,
                field: "attachments",
              }}
              disabled={readonly}
              refUploadTrigger={(uploadFile) =>
                (refTriggerUploadFile.current = uploadFile)
              }
            />
          </div>
          {!!value?.attachments?.length && <div className="h-6" />}
        </AnimatedHeight>
      )}

      <AnimatedHeight>
        {!!value?.content?.length && (
          <div className="text-right">
            <div
              className={twMerge(
                "space-x-2 text-right",
                !readonly || value.discount?.value ? "mb-4" : "mb-0"
              )}
            >
              {!props.hideAttachments && !readonly && (
                <Button
                  className="m-0"
                  data-tooltip="Documents à joindre à la facture"
                  theme="invisible"
                  size="sm"
                  icon={(p) => <PaperClipIcon {...p} />}
                  onClick={refTriggerUploadFile.current}
                />
              )}
              {!props.hideDiscount &&
                !!(!readonly || value.discount?.value) && (
                  <InputButton
                    size="sm"
                    label="Réduction globale"
                    empty="Pas de réduction globale"
                    placeholder="Options"
                    icon={(p) => <ReceiptPercentIcon {...p} />}
                    content={() => (
                      <InvoiceDiscountInput
                        onChange={(discount) =>
                          onChange({ ...value, discount })
                        }
                        value={value?.discount}
                      />
                    )}
                    value={value?.discount}
                  >
                    {"- "}
                    {(value?.discount?.value || 0) > 0 ? (
                      <>
                        {value.discount?.mode === "amount"
                          ? formatAmount(value.discount?.value)
                          : `${value.discount?.value}%`}
                      </>
                    ) : undefined}{" "}
                    sur le total
                  </InputButton>
                )}
              {!readonly && (
                <Button
                  theme="outlined"
                  size="sm"
                  icon={(p) => <PlusIcon {...p} />}
                  onClick={addLine}
                >
                  Ajouter une ligne
                </Button>
              )}
            </div>
            <InvoiceTotalCard invoice={value} />
          </div>
        )}
      </AnimatedHeight>
    </>
  );
};
