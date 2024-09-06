import { AnimatedHeight } from "@atoms/animated-side/height";
import { Button } from "@atoms/button/button";
import { Card } from "@atoms/card";
import { Base, Info, SectionSmall } from "@atoms/text";
import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { FilesInput } from "@components/input-rest/files";
import { Invoices } from "@features/invoices/types/types";
import { formatAmount } from "@features/utils/format/strings";
import {
  PaperClipIcon,
  PlusIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/20/solid";
import _ from "lodash";
import { Fragment, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { InvoiceDiscountInput } from "./components/discount-input";
import { DropInvoiceLine, InvoiceLineInput } from "./invoice-line-input";

export const InvoiceLinesInput = ({
  onChange,
  value,
  ctrl,
  readonly,
}: {
  onChange: (v: Invoices) => void;
  value: Invoices;
  ctrl: FormControllerFuncType<Invoices>;
  readonly?: boolean;
}) => {
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
        {value.content?.map((e, index) => (
          <Fragment key={e._id}>
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
              ctrl={ctrl(`content.${index}`)}
              onRemove={() => {
                onChange({
                  ...value,
                  content: value.content?.filter((a) => a._id !== e._id),
                });
              }}
              onDuplicate={() => {
                // Add item just after the current one
                const content = _.cloneDeep(value.content || []);
                const index = content.findIndex((a) => a._id === e._id);
                content.splice(index + 1, 0, {
                  ...e,
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
                      const index = content.findIndex((a) => a._id === e._id);
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
                      const index = content.findIndex((a) => a._id === e._id);
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
                if (item._id === e._id) return;
                // Place item after e
                const content = _.cloneDeep(value.content || []).filter(
                  (a) => a._id !== item._id
                );
                const index = content.findIndex((a) => a._id === e._id);
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

      <AnimatedHeight className="text-left">
        {!!ctrl("attachments")?.value?.length && (
          <Info>Documents envoyés avec la facture</Info>
        )}
        <div>
          <FilesInput
            ctrl={ctrl("attachments")}
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
        {!!ctrl("attachments")?.value?.length && <div className="h-6" />}
      </AnimatedHeight>

      <AnimatedHeight>
        {!!value?.content?.length && (
          <div className="text-right">
            <div
              className={twMerge(
                "space-x-2 text-right",
                !readonly || value.discount?.value ? "mb-4" : "mb-0"
              )}
            >
              {!readonly && (
                <Button
                  className="m-0"
                  data-tooltip="Documents à joindre à la facture"
                  theme="invisible"
                  size="sm"
                  icon={(p) => <PaperClipIcon {...p} />}
                  onClick={refTriggerUploadFile.current}
                />
              )}
              {!!(!readonly || value.discount?.value) && (
                <InputButton
                  size="sm"
                  label="Réduction globale"
                  empty="Pas de réduction globale"
                  placeholder="Options"
                  icon={(p) => <ReceiptPercentIcon {...p} />}
                  content={
                    <InvoiceDiscountInput
                      onChange={ctrl("discount").onChange}
                      value={ctrl("discount").value}
                    />
                  }
                  value={ctrl("discount").value}
                >
                  {"- "}
                  {(ctrl("discount.value").value || 0) > 0 ? (
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
            <div className="flex justify-end">
              <div className="flex border border-slate-50 dark:border-slate-800 w-max p-2 rounded-md inline-block">
                <div className="grow" />
                <Base>
                  <div className="space-y-2 min-w-64 block">
                    <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                      <span>Total HT</span>
                      {formatAmount(value.total?.initial || 0)}
                    </div>
                    {!!(value.total?.discount || 0) && (
                      <>
                        <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                          <span>Remise</span>
                          <span>
                            {formatAmount(value.total?.discount || 0)}
                          </span>
                        </div>
                        <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                          <span>Total HT après remise</span>
                          <span>{formatAmount(value.total?.total || 0)}</span>
                        </div>
                      </>
                    )}
                    <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                      <span>TVA</span>
                      {formatAmount(value.total?.taxes || 0)}
                    </div>
                    <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                      <SectionSmall className="inline">Total TTC</SectionSmall>
                      <SectionSmall className="inline">
                        {formatAmount(value.total?.total_with_taxes || 0)}
                      </SectionSmall>
                    </div>
                  </div>
                </Base>
              </div>
            </div>
          </div>
        )}
      </AnimatedHeight>
    </>
  );
};
