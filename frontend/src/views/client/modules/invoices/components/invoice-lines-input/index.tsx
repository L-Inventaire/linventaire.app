import { AnimatedHeight } from "@atoms/animated-side/height";
import { Button } from "@atoms/button/button";
import { Card } from "@atoms/card";
import { Info } from "@atoms/text";
import { FormContextContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { FilesInput } from "@components/input-rest/files";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { formatAmount } from "@features/utils/format/strings";
import {
  PaperClipIcon,
  PlusIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/20/solid";
import { Box, Flex, Heading, Card as RadixCard } from "@radix-ui/themes";
import { normalizeInvoiceGroups } from "@shared/invoices";
import _ from "lodash";
import { Fragment, useContext, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { InvoiceDiscountInput } from "./components/discount-input";
import { InvoiceTotalCard } from "./components/invoice-total-card";
import {
  createEmptyLine,
  createGroupFromLine,
  createGroupHeader,
  duplicateGroup,
  moveBlock,
  moveGroup,
  moveLine,
  moveLineInGroup,
  removeGroup,
  toBlocks,
} from "./groups";
import { InvoiceGroupInput } from "./invoice-group-input";
import {
  DropInvoiceLine,
  INVOICE_GROUP_DND,
  INVOICE_LINE_DND,
  InvoiceLineInput,
} from "./invoice-line-input";

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
  const content = value.content || [];
  const blocks = toBlocks(content);
  const setContent = (content: InvoiceLine[]) =>
    onChange({ ...value, content: normalizeInvoiceGroups(content) });
  const updateLine = (line: InvoiceLine) =>
    setContent(content.map((a) => (a._id === line._id ? line : a)));

  const addLine = () => setContent([...content, createEmptyLine()]);

  // Group just created from a line: its options modal opens right away
  const [newGroupId, setNewGroupId] = useState<string | null>(null);
  const createGroup = (line: InvoiceLine) => {
    const header = createGroupHeader();
    const isEmpty = !line.article && !line.name && !line.unit_price;
    // An empty line is replaced by the group header and keeps its _id
    setNewGroupId(isEmpty ? line._id! : header._id!);
    setContent(createGroupFromLine(content, line, header));
  };

  // Move a line or a group (outside of any group) after the element "afterId"
  const moveAfter = (item: InvoiceLine, afterId: string | null) =>
    setContent(
      item.type === "group"
        ? moveGroup(content, item, afterId)
        : moveLine(content, item, afterId, ""),
    );

  const renderLine = (
    line: InvoiceLine,
    options: {
      hidePrices?: boolean;
      onCreateGroup?: () => void;
      onMoveUp?: () => void;
      onMoveDown?: () => void;
    },
  ) => (
    <InvoiceLineInput
      invoice={value}
      ctrl={{ onChange: updateLine, value: line }}
      hidePrices={options.hidePrices}
      onCreateGroup={options.onCreateGroup}
      onRemove={() => setContent(content.filter((a) => a._id !== line._id))}
      onDuplicate={() => {
        // Add item just after the current one (in the same group)
        const list = [...content];
        const index = list.findIndex((a) => a._id === line._id);
        list.splice(index + 1, 0, { ..._.cloneDeep(line), _id: _.uniqueId() });
        setContent(list);
      }}
      onMoveUp={options.onMoveUp}
      onMoveDown={options.onMoveDown}
    />
  );

  return (
    <>
      <div
        className={twMerge(
          "relative flex w-full items-center opacity-100 mb-3 transition-all group/invoice-line",
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
                  "text-right w-1/6 shrink-0 border-l dark:border-slate-700",
                )}
              >
                <Heading size={"2"} className="py-1 px-2.5">
                  Quantité
                </Heading>
              </Box>
              <Box
                className={twMerge(
                  "text-right w-1/6 shrink-0 border-l dark:border-slate-700",
                )}
              >
                <Heading size={"2"} className="py-1 px-2.5">
                  Prix U.
                </Heading>
              </Box>
              <Box
                className={twMerge(
                  "text-right w-1/5 shrink-0 border-l dark:border-slate-700",
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
        {blocks.map((block, blockIndex) => {
          const isGroup = block.line.type === "group";
          const lastId = (_.last(block.lines) || block.line)._id!;
          return (
            <Fragment key={block.line._id}>
              {blockIndex === 0 && (
                <DropInvoiceLine
                  accept={[INVOICE_LINE_DND, INVOICE_GROUP_DND]}
                  onMove={(item) => moveAfter(item, null)}
                />
              )}
              {isGroup ? (
                <InvoiceGroupInput
                  invoice={value}
                  value={block.line}
                  lines={block.lines}
                  readonly={readonly}
                  autoOpen={newGroupId === block.line._id}
                  onChange={(header) => updateLine(header)}
                  onAddLine={() =>
                    setContent([
                      ...content,
                      createEmptyLine(block.line.group),
                    ])
                  }
                  onDropLine={(item) =>
                    setContent(
                      moveLine(content, item, block.line._id!, block.line.group),
                    )
                  }
                  onRemove={(keepLines) =>
                    setContent(removeGroup(content, block.line, keepLines))
                  }
                  onDuplicate={() =>
                    setContent(duplicateGroup(content, block.line))
                  }
                  onMoveUp={
                    blockIndex === 0
                      ? undefined
                      : () => setContent(moveBlock(content, block.line._id!, -1))
                  }
                  onMoveDown={
                    blockIndex === blocks.length - 1
                      ? undefined
                      : () => setContent(moveBlock(content, block.line._id!, 1))
                  }
                >
                  <DropInvoiceLine
                    size="small"
                    onMove={(item) =>
                      setContent(
                        moveLine(
                          content,
                          item,
                          block.line._id!,
                          block.line.group,
                        ),
                      )
                    }
                  />
                  {block.lines.map((line, index) => (
                    <Fragment key={line._id}>
                      {renderLine(line, {
                        hidePrices: block.line.group_hide_prices,
                        onMoveUp:
                          index === 0
                            ? undefined
                            : () =>
                                setContent(
                                  moveLineInGroup(content, line._id!, -1),
                                ),
                        onMoveDown:
                          index === block.lines.length - 1
                            ? undefined
                            : () =>
                                setContent(
                                  moveLineInGroup(content, line._id!, 1),
                                ),
                      })}
                      <DropInvoiceLine
                        size="small"
                        onMove={(item) =>
                          setContent(
                            moveLine(content, item, line._id!, line.group),
                          )
                        }
                      />
                    </Fragment>
                  ))}
                </InvoiceGroupInput>
              ) : (
                renderLine(block.line, {
                  onCreateGroup: () => createGroup(block.line),
                  onMoveUp:
                    blockIndex === 0
                      ? undefined
                      : () =>
                          setContent(moveBlock(content, block.line._id!, -1)),
                  onMoveDown:
                    blockIndex === blocks.length - 1
                      ? undefined
                      : () =>
                          setContent(moveBlock(content, block.line._id!, 1)),
                })
              )}
              <DropInvoiceLine
                accept={[INVOICE_LINE_DND, INVOICE_GROUP_DND]}
                size={isGroup ? "small" : "default"}
                onMove={(item) => moveAfter(item, lastId)}
              />
            </Fragment>
          );
        })}
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
                !readonly || value.discount?.value ? "mb-4" : "mb-0",
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
                    value={
                      (value?.discount?.value || 0) > 0
                        ? value?.discount
                        : undefined
                    }
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
