import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import { Base, BaseSmall, Info } from "@atoms/text";
import {
  FormContextContext,
  FormControllerType,
} from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { useArticle } from "@features/articles/hooks/use-articles";
import { CtrlKAtom } from "@features/ctrlk/store";
import { CtrlKPathType } from "@features/ctrlk/types";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { StockItems } from "@features/stock/types/types";
import { tvaOptions, unitOptions } from "@features/utils/constants";
import { formatAmount, getTextFromHtml } from "@features/utils/format/strings";
import {
  CheckIcon,
  CubeIcon,
  LockClosedIcon,
  ReceiptPercentIcon,
  TruckIcon,
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
import _ from "lodash";
import { useContext, useEffect, useState } from "react";
import { useDrag, useDragLayer, useDrop } from "react-dnd";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { getArticleIcon } from "../../../articles/components/article-icon";
import { getTvaValue } from "../../utils";
import { renderCompletion } from "../invoices-details";
import { InvoiceLineArticleInput } from "./components/line-article";
import { InvoiceLinePriceInput } from "./components/line-price";
import { InvoiceLineQuantityInput } from "./components/line-quantity";
import { CompletionTags } from "./components/completion-tags";
import { InvoiceDiscountInput } from "./components/discount-input";

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
  const openCtrlK = useSetRecoilState(CtrlKAtom);

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

  const hasMultipleTVAs =
    _.uniq((props.invoice?.content || []).map((a) => a.tva)).length > 1;
  const hasOptionalArticles = (props.invoice?.content || []).some(
    (a) => a.optional
  );
  const hasDiscountedArticles = (props.invoice?.content || []).some(
    (a) => a.discount?.value || 0
  );

  return (
    <>
      <div
        ref={dragRef}
        className={twMerge(
          "space-x-2 flex w-full items-center max-h-24 opacity-100 transition-all mb-2 group/invoice-line",
          (deleted || dragging) && "max-h-0 opacity-0 !m-0"
        )}
      >
        {readonly &&
          (props.invoice?.type === "supplier_quotes" ||
            props.invoice?.type === "quotes") && (
            <div className="w-32 shrink-0 flex items-center justify-start mr-2">
              {value.type !== "separation" && (
                <CompletionTags invoice={props.invoice} lines={[value]} />
              )}
            </div>
          )}
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
          {hasOptionalArticles && (
            <Button
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
              theme="outlined"
              className="rounded-r-none shrink-0"
              icon={({ className }) =>
                value.optional ? (
                  <div className="border-slate-100 border rounded w-4 h-4 flex items-center justify-center">
                    {value.optional_checked ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <div className="w-1 h-1 dark:bg-white bg-black opacity-50" />
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
          <InputButton
            autoFocus={!readonly && !value.name}
            className={twMerge(
              "text-left justify-start grow",
              hasOptionalArticles && "rounded-l-none",
              value.type !== "separation" && "rounded-r-none"
            )}
            placeholder={
              value.type !== "separation" ? "Article" : "Texte libre"
            }
            icon={(p) =>
              value.type === "separation" ? (
                <Bars3BottomLeftIcon {...p} />
              ) : (
                getArticleIcon(article?.type)(p)
              )
            }
            empty="Vide"
            content={<InvoiceLineArticleInput {...props} article={article} />}
            value={value.description || value.name || article?.name}
          >
            <div
              className={twMerge(
                value.type !== "separation" &&
                  "overflow-hidden text-ellipsis line-clamp-1"
              )}
            >
              <Base className={value.type === "separation" ? "block" : "mr-2"}>
                {value.name || article?.name}
              </Base>
              <Info>
                {getTextFromHtml(
                  value.description || article?.description || ""
                )}
              </Info>
            </div>
          </InputButton>
          {value.type !== "separation" && (
            <>
              <InputButton
                className="rounded-none shrink-0"
                label="Quantité"
                placeholder="Quantité"
                content={
                  <InvoiceLineQuantityInput {...props} article={article} />
                }
                value={
                  (value.quantity || 1) +
                  " " +
                  (unitOptions.find((a) => a.value === value.unit)?.label ||
                    unitOptions.find((a) => a.value === "unit")?.label)
                }
              />
              <InputButton
                data-tooltip={readonly ? "Prix total HT" : "Prix unitaire"}
                className={twMerge(
                  "rounded-l-none shrink-0",
                  !!(value.discount?.value || 0) && "rounded-br-none"
                )}
                label="Prix et TVA"
                placeholder="Prix et TVA"
                content={<InvoiceLinePriceInput {...props} article={article} />}
                value={value.unit_price}
              >
                {formatAmount(
                  (readonly ? value.quantity || 0 : 1) *
                    (value.unit_price || 0),
                  props.invoice?.currency || "EUR"
                )}
                {hasMultipleTVAs && (
                  <Info className="inline-block min-w-16 text-right ml-1">
                    {getTvaValue(value.tva || "0")
                      ? "TVA " + getTvaValue(value.tva || "0") * 100 + "%"
                      : tvaOptions.find((a) => a.value === value.tva)?.label}
                  </Info>
                )}
              </InputButton>
            </>
          )}
        </div>
        {!readonly && (
          <div className="-space-x-px">
            <Button
              onClick={(e) =>
                setMenu({
                  target: e.currentTarget,
                  menu: [
                    ...((value.type !== "separation"
                      ? [
                          {
                            label: value.discount?.value
                              ? "Retirer la réduction"
                              : "Appliquer une réduction",
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
            content={
              <InvoiceDiscountInput
                onChange={(d) => onChange?.({ ...value, discount: d })}
                value={value.discount}
              />
            }
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
          "absolute w-full h-px top-0 transition-all delay-400",
          isDragging && "h-10 -top-4 -left-1/2 w-[200%]",
          isOver && "h-20"
        )}
      ></div>
      <div
        className={twMerge(
          "absolute w-full h-0.5 -top-[5px] opacity-0 transition-all bg-wood-300 rounded-full pointer-events-none shadow-sm",
          isOver && "opacity-100"
        )}
      />
    </div>
  );
};
