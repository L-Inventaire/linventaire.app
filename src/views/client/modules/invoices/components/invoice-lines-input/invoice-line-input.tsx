import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import { Unit } from "@atoms/input/input-unit";
import { Base, BaseSmall, Info } from "@atoms/text";
import {
  FormContextContext,
  FormControllerType,
} from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { useArticle } from "@features/articles/hooks/use-articles";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { tvaOptions } from "@features/utils/constants";
import { formatAmount, getTextFromHtml } from "@features/utils/format/strings";
import {
  CheckIcon,
  LockClosedIcon,
  ReceiptPercentIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Bars3BottomLeftIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { Badge, Box, Card, Code, Flex, Text } from "@radix-ui/themes";
import { frequencyOptions } from "@views/client/modules/articles/components/article-details";
import { useContext, useEffect, useState } from "react";
import { useDrag, useDragLayer, useDrop } from "react-dnd";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { getArticleIcon } from "../../../articles/components/article-icon";
import { getTvaValue } from "../../utils";
import { CompletionTags } from "./components/completion-tags";
import { InvoiceDiscountInput } from "./components/discount-input";
import { InvoiceLineArticleInput } from "./components/line-article";
import { InvoiceLinePriceInput } from "./components/line-price";
import { InvoiceLineQuantityInput } from "./components/line-quantity";

export const InvoiceLineInput = (props: {
  invoice?: Invoices;
  value?: InvoiceLine;
  onChange?: (v: InvoiceLine) => void;
  ctrl?: FormControllerType<InvoiceLine>;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  readonly?: boolean;
}) => {
  const formContext = useContext(FormContextContext);

  const value = props.ctrl?.value || props.value || ({} as InvoiceLine);
  const onChange = props.ctrl?.onChange || props.onChange;
  const readonly = props.readonly ?? formContext.readonly;

  const { article } = useArticle(value.article || "");

  const setMenu = useSetRecoilState(DropDownAtom);
  const [{ dragging }, dragRef] = useDrag(
    () => ({
      canDrag: !readonly,
      type: "invoice-line",
      item: value,
      collect: (monitor) => ({
        dragging: monitor.isDragging() ? true : false,
      }),
    }),
    [value]
  );
  const [deleted, setDeleted] = useState(true);
  useEffect(() => {
    // Create animated entrance
    setDeleted(false);
  }, []);

  const { otherDragging } = useDragLayer((monitor) => ({
    otherDragging: monitor.isDragging(),
  }));

  const hasOptionalArticles = (props.invoice?.content || []).some(
    (a) => a.optional
  );
  const isSeparation =
    value.type === "separation" || value.type === "correction";

  return (
    <>
      <div
        ref={dragRef}
        className={twMerge(
          "relative flex w-full items-center opacity-100 transition-all mb-3 group/invoice-line",
          (deleted || dragging) && "max-h-0 opacity-0 !m-0"
        )}
      >
        {!readonly && (
          <div
            className={twMerge(
              "absolute w-5 h-5 flex items-center justify-start cursor-grab opacity-0 group-hover/invoice-line:opacity-100 -left-4",
              otherDragging && !dragging && "opacity-0"
            )}
          >
            <EllipsisVerticalIcon className="w-4 h-4 opacity-25 -ml-0.5" />
            <EllipsisVerticalIcon className="w-4 h-4 opacity-25 -ml-3" />
          </div>
        )}
        <Card
          variant="ghost"
          className={twMerge(
            "w-full p-0 border m-0 dark:border-slate-700",
            !value.optional_checked &&
              value.optional &&
              "border-dashed shadow-none"
          )}
        >
          <Flex direction="column">
            <Flex align="stretch">
              <Box flexGrow="1">
                <InputButton
                  theme="invisible"
                  readonly={readonly}
                  className="rounded-none flex grow p-3 m-0 h-full w-full box-border text-left justify-start"
                  autoFocus={!readonly && !value.name}
                  placeholder={!isSeparation ? "Article" : "Texte libre"}
                  icon={(p) =>
                    isSeparation ? (
                      <Bars3BottomLeftIcon {...p} />
                    ) : (
                      getArticleIcon(article?.type)(p)
                    )
                  }
                  empty="Vide"
                  content={({ close }) => (
                    <InvoiceLineArticleInput
                      {...props}
                      invoice={props.invoice!}
                      article={article}
                      close={close}
                    />
                  )}
                  value={value.description || value.name || article?.name}
                >
                  <Text
                    as="div"
                    size="2"
                    weight="bold"
                    className="overflow-hidden text-ellipsis line-clamp-1"
                  >
                    {value.name || article?.name}
                  </Text>
                  <Text
                    as="div"
                    color="gray"
                    size="2"
                    className="overflow-hidden text-ellipsis line-clamp-1"
                  >
                    {getTextFromHtml(
                      value.description || article?.description || "-"
                    )}
                  </Text>
                </InputButton>
              </Box>
              {!isSeparation && (
                <Box
                  className={twMerge(
                    "text-right w-1/5 shrink-0 border-l dark:border-slate-700",
                    !value.optional_checked && value.optional && "border-dashed"
                  )}
                >
                  <InputButton
                    readonly={readonly}
                    theme="invisible"
                    className="rounded-none  h-full w-full flex grow p-3 m-0 box-border text-right justify-end"
                    label="Quantité"
                    placeholder="Quantité"
                    content={() => (
                      <InvoiceLineQuantityInput {...props} article={article} />
                    )}
                    value={value.quantity}
                  >
                    <Text as="div" size="2" weight="bold">
                      {value.quantity || 1} <Unit unit={value?.unit} />
                    </Text>
                    <Text as="div" color="gray" size="2">
                      {value.subscription &&
                      frequencyOptions?.find(
                        (a) => a.value === value.subscription
                      )?.label ? (
                        <Badge size="1" color="blue">
                          {
                            frequencyOptions?.find(
                              (a) => a.value === value.subscription
                            )?.label
                          }
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </Text>
                  </InputButton>
                </Box>
              )}
              {(!isSeparation || value.type === "correction") && (
                <Box
                  className={twMerge(
                    "text-right w-1/5 shrink-0 border-l dark:border-slate-700",
                    !value.optional_checked && value.optional && "border-dashed"
                  )}
                >
                  <InputButton
                    readonly={readonly}
                    theme="invisible"
                    data-tooltip={readonly ? "Prix total HT" : "Prix unitaire"}
                    className="rounded-none h-full w-full flex grow p-3 m-0 box-border text-right justify-end"
                    label="Prix et TVA"
                    placeholder="Prix et TVA"
                    content={() => (
                      <>
                        <InvoiceLinePriceInput {...props} article={article} />
                        <br />
                        <InvoiceDiscountInput
                          onChange={(d) =>
                            onChange?.({ ...value, discount: d })
                          }
                          value={value.discount}
                        />
                      </>
                    )}
                    value={value.unit_price}
                  >
                    <Text as="div" size="2" weight="bold">
                      {formatAmount(
                        (value.quantity || 0) * (value.unit_price || 0),
                        props.invoice?.currency || "EUR"
                      )}
                    </Text>
                    <Text
                      as="div"
                      color="gray"
                      size="2"
                      className="whitespace-nowrap"
                    >
                      {getTvaValue(value.tva || "0")
                        ? "TVA " + getTvaValue(value.tva || "0") * 100 + "%"
                        : tvaOptions.find((a) => a.value === value.tva)?.label}
                      {!!value.discount?.value && (
                        <Code color="crimson" className="ml-2">
                          -{" "}
                          {value.discount?.mode === "amount"
                            ? formatAmount(value.discount?.value || 0, "EUR")
                            : value.discount?.value + "%"}
                        </Code>
                      )}
                    </Text>
                  </InputButton>
                </Box>
              )}
            </Flex>
            {(value.type !== "separation" || !readonly) && (
              <Flex
                align="center"
                gap="3"
                className={twMerge(
                  "p-3 border-t dark:border-slate-700",
                  !value.optional_checked && value.optional && "border-dashed"
                )}
              >
                <Box flexGrow="1">
                  {!(value.optional && !value.optional_checked) && (
                    <>
                      {(props.invoice?.type === "supplier_quotes" ||
                        props.invoice?.type === "quotes") && (
                        <div className="w-32 shrink-0 flex items-center justify-start mr-2">
                          {!isSeparation && (
                            <CompletionTags
                              invoice={props.invoice!}
                              lines={[value]}
                              overflow
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </Box>

                {value.optional && (
                  <Text size="2">
                    Ligne optionelle{" "}
                    {value.optional_checked && (
                      <Text weight="bold">selectionnée</Text>
                    )}
                    {!value.optional_checked && (
                      <Text weight="bold">non selectionnée</Text>
                    )}
                  </Text>
                )}

                {hasOptionalArticles && !isSeparation && (
                  <Button
                    disabled={readonly}
                    onClick={(e) =>
                      setMenu({
                        target: e.currentTarget,
                        menu: [
                          {
                            label: "Option cochée",
                            icon: (p) => <CheckCircleIcon {...p} />,
                            onClick: () => {
                              onChange?.({
                                ...value,
                                optional: true,
                                optional_checked: true,
                              });
                            },
                          },
                          {
                            label: "Option décochée",
                            icon: (p) => <XCircleIcon {...p} />,
                            onClick: () => {
                              onChange?.({
                                ...value,
                                optional: true,
                                optional_checked: false,
                              });
                            },
                          },
                          {
                            type: "divider",
                          },
                          {
                            label: "Article non optionnel",
                            icon: (p) => <LockClosedIcon {...p} />,
                            onClick: () => {
                              onChange?.({
                                ...value,
                                optional: false,
                                optional_checked: false,
                              });
                            },
                          },
                        ],
                      })
                    }
                    theme="invisible"
                    size="xs"
                    icon={({ className }) =>
                      value.optional ? (
                        <div className="border-slate-100 border rounded w-4 h-4 flex items-center justify-center">
                          {value.optional_checked ? (
                            <CheckIcon className="w-4 h-4" />
                          ) : (
                            <div className="w-1 h-1 dark:bg-white bg-black dark:bg-white opacity-50" />
                          )}
                        </div>
                      ) : (
                        <LockClosedIcon
                          className={twMerge(className, "opacity-25")}
                        />
                      )
                    }
                  />
                )}
                {!readonly && (
                  <>
                    {props.onRemove && (
                      <Button
                        danger
                        theme="invisible"
                        data-tooltip="Retirer la ligne"
                        icon={(p) => <TrashIcon {...p} />}
                        onClick={() => {
                          setDeleted(true);
                          setTimeout(props.onRemove!, 300);
                        }}
                        size="xs"
                      />
                    )}
                    <Button
                      onClick={(e) =>
                        setMenu({
                          target: e.currentTarget,
                          menu: [
                            ...((!isSeparation
                              ? [
                                  {
                                    label: value.discount?.value
                                      ? "Retirer la réduction"
                                      : "Ajouter une réduction",
                                    icon: (p) => <ReceiptPercentIcon {...p} />,
                                    onClick: () => {
                                      onChange?.({
                                        ...value,
                                        discount: value.discount?.value
                                          ? undefined
                                          : {
                                              value: 10,
                                              mode: "percentage",
                                            },
                                      });
                                    },
                                  },
                                  ...((props.invoice?.type === "quotes"
                                    ? [
                                        {
                                          label: value.optional
                                            ? "Article obligatoire"
                                            : "Article optionnel",
                                          icon: (p) =>
                                            value.optional ? (
                                              <LockClosedIcon {...p} />
                                            ) : (
                                              <CheckCircleIcon {...p} />
                                            ),
                                          onClick: () => {
                                            onChange?.({
                                              ...value,
                                              optional: !value.optional,
                                            });
                                          },
                                        },
                                      ]
                                    : []) as DropDownMenuType),
                                  { type: "divider" },
                                ]
                              : []) as DropDownMenuType),
                            {
                              label: "Dupliquer",
                              icon: (p) => <DocumentDuplicateIcon {...p} />,
                              onClick: props.onDuplicate,
                            },
                            {
                              label: "Déplacer vers le haut",
                              icon: (p) => <ArrowUpIcon {...p} />,
                              onClick: props.onMoveUp,
                            },
                            {
                              label: "Déplacer vers le bas",
                              icon: (p) => <ArrowDownIcon {...p} />,
                              onClick: props.onMoveDown,
                            },
                          ],
                        })
                      }
                      theme="invisible"
                      icon={(p) => <EllipsisHorizontalIcon {...p} />}
                      size="xs"
                    />
                  </>
                )}
              </Flex>
            )}
          </Flex>
        </Card>
      </div>
      {false && (
        <>
          <div
            ref={dragRef}
            className={twMerge(
              "space-x-2 flex w-full items-center opacity-100 transition-all mb-3 group/invoice-line",
              (deleted || dragging) && "max-h-0 opacity-0 !m-0"
            )}
          >
            <div className="-space-x-px flex items-center grow relative">
              {!readonly && (
                <div
                  className={twMerge(
                    "absolute w-5 h-5 flex items-center justify-start cursor-grab opacity-0 group-hover/invoice-line:opacity-100 -left-5",
                    otherDragging && !dragging && "opacity-0"
                  )}
                >
                  <EllipsisVerticalIcon className="w-4 h-4 opacity-25 -ml-0.5" />
                  <EllipsisVerticalIcon className="w-4 h-4 opacity-25 -ml-3" />
                </div>
              )}

              <InputButton
                autoFocus={!readonly && !value.name}
                className={twMerge(
                  "text-left justify-start grow",
                  hasOptionalArticles && !isSeparation && "rounded-l-none",
                  !isSeparation && "rounded-r-none"
                )}
                placeholder={!isSeparation ? "Article" : "Texte libre"}
                icon={(p) =>
                  isSeparation ? (
                    <Bars3BottomLeftIcon {...p} />
                  ) : (
                    getArticleIcon(article?.type)(p)
                  )
                }
                empty="Vide"
                content={({ close }) => (
                  <InvoiceLineArticleInput
                    {...props}
                    invoice={props.invoice!}
                    article={article}
                    close={close}
                  />
                )}
                value={value.description || value.name || article?.name}
              >
                <div
                  className={twMerge(
                    !isSeparation &&
                      "overflow-hidden text-ellipsis line-clamp-1"
                  )}
                >
                  <Base className={isSeparation ? "block" : "mr-2"}>
                    {value.name || article?.name}
                  </Base>
                  <Info>
                    {getTextFromHtml(
                      value.description || article?.description || ""
                    )}
                  </Info>
                </div>
              </InputButton>
            </div>
            {!readonly && (
              <div className="-space-x-px shrink-0">
                <Button
                  onClick={(e) =>
                    setMenu({
                      target: e.currentTarget,
                      menu: [
                        ...((!isSeparation
                          ? [
                              {
                                label: value.discount?.value
                                  ? "Retirer la réduction"
                                  : "Ajouter une réduction",
                                icon: (p) => <ReceiptPercentIcon {...p} />,
                                onClick: () => {
                                  onChange?.({
                                    ...value,
                                    discount: value.discount?.value
                                      ? undefined
                                      : {
                                          value: 10,
                                          mode: "percentage",
                                        },
                                  });
                                },
                              },
                              ...((props.invoice?.type === "quotes"
                                ? [
                                    {
                                      label: value.optional
                                        ? "Article obligatoire"
                                        : "Article optionnel",
                                      icon: (p) =>
                                        value.optional ? (
                                          <LockClosedIcon {...p} />
                                        ) : (
                                          <CheckCircleIcon {...p} />
                                        ),
                                      onClick: () => {
                                        onChange?.({
                                          ...value,
                                          optional: !value.optional,
                                        });
                                      },
                                    },
                                  ]
                                : []) as DropDownMenuType),
                              { type: "divider" },
                            ]
                          : []) as DropDownMenuType),
                        {
                          label: "Dupliquer",
                          icon: (p) => <DocumentDuplicateIcon {...p} />,
                          onClick: props.onDuplicate,
                        },
                        {
                          label: "Déplacer vers le haut",
                          icon: (p) => <ArrowUpIcon {...p} />,
                          onClick: props.onMoveUp,
                        },
                        {
                          label: "Déplacer vers le bas",
                          icon: (p) => <ArrowDownIcon {...p} />,
                          onClick: props.onMoveDown,
                        },
                      ],
                    })
                  }
                  theme="outlined"
                  className={twMerge("rounded-r-none shrink-0")}
                  icon={(p) => <EllipsisHorizontalIcon {...p} />}
                />
                {props.onRemove && (
                  <Button
                    theme="outlined"
                    data-tooltip="Retirer la ligne"
                    className="shrink-0 text-red-500 dark:text-red-500 rounded-l-none"
                    icon={(p) => <TrashIcon {...p} />}
                    onClick={() => {
                      setDeleted(true);
                      setTimeout(props.onRemove!, 300);
                    }}
                  />
                )}
              </div>
            )}
          </div>
          {!!(value.discount?.value || 0) && (
            <div
              className={twMerge(
                "mb-2 text-right -mt-2 max-h-6 transition-all",
                readonly ? "" : "mr-16",
                (deleted || dragging) && "max-h-0 opacity-0 !my-0"
              )}
            >
              <InputButton
                className={twMerge(
                  "shrink-0 rounded-t-none -mt-px",
                  readonly ? "" : "-mr-px"
                )}
                label="Réduction"
                placeholder="Réduction"
                value={value.discount?.value}
                icon={(p) => <ReceiptPercentIcon {...p} />}
                content={() => (
                  <InvoiceDiscountInput
                    onChange={(d) => onChange?.({ ...value, discount: d })}
                    value={value.discount}
                  />
                )}
              >
                <BaseSmall>
                  {"- "}
                  {value.discount?.mode === "percentage"
                    ? `${value.discount?.value}%`
                    : formatAmount(value.discount?.value || 0)}{" "}
                  sur la ligne
                </BaseSmall>
              </InputButton>
            </div>
          )}
        </>
      )}
    </>
  );
};

export const DropInvoiceLine = (props: {
  onMove: (item: InvoiceLine) => void;
}) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "invoice-line",
      drop: (value: InvoiceLine) => props.onMove(value),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [props.onMove]
  );

  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  return (
    <div className={twMerge("relative w-full h-0")}>
      <div
        ref={drop}
        className={twMerge(
          "absolute w-full h-px top-0 transition-all delay-400 z-10",
          isDragging && "h-24 -top-14 -left-1/2 w-[200%]",
          isOver && "h-24"
        )}
      ></div>
      <div
        className={twMerge(
          "absolute w-full h-0.5 -top-[5px] opacity-0 transition-all bg-slate-300 rounded-full pointer-events-none shadow-sm",
          isOver && "opacity-100"
        )}
      />
    </div>
  );
};
