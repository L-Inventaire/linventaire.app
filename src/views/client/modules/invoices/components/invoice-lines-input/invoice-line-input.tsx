import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { DropDownAtom } from "@atoms/dropdown";
import { Base, Info } from "@atoms/text";
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
  ArrowDownIcon,
  ArrowUpIcon,
  BanknotesIcon,
  Bars3BottomLeftIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  HashtagIcon,
  PercentBadgeIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useContext, useEffect, useState } from "react";
import { useDrag, useDragLayer, useDrop } from "react-dnd";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { getArticleIcon } from "../../../articles/components/article-icon";
import { InvoiceLineArticleInput } from "./components/line-article";
import { InvoiceLineQuantityInput } from "./components/line-quantity";
import { InvoiceLinePriceInput } from "./components/line-price";
import { renderCompletion } from "../invoices-details";

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

  return (
    <div
      ref={dragRef}
      className={twMerge(
        "space-x-2 flex w-full items-center max-h-24 opacity-100 transition-all mb-2 group/invoice-line",
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
          className={twMerge("grow text-left justify-start")}
          placeholder={value.type !== "separation" ? "Article" : "Texte libre"}
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
              {getTextFromHtml(value.description || article?.description || "")}
            </Info>
          </div>
        </InputButton>
        {value.type !== "separation" && (
          <>
            <div className="w-2.5 shrink-0" />
            <InputButton
              className="rounded-r-none shrink-0"
              label="Quantité"
              placeholder="Quantité"
              content={
                <InvoiceLineQuantityInput {...props} article={article} />
              }
              icon={(p) => <HashtagIcon {...p} />}
              value={
                (value.quantity || 1) +
                " " +
                (unitOptions.find((a) => a.value === value.unit)?.label ||
                  unitOptions.find((a) => a.value === "unit")?.label)
              }
            />
            <InputButton
              className="rounded-none shrink-0"
              label="Prix et TVA"
              placeholder="Prix et TVA"
              icon={(p) => <BanknotesIcon {...p} />}
              content={<InvoiceLinePriceInput {...props} article={article} />}
              value={`${formatAmount(
                value.unit_price || 0,
                props.invoice?.currency || "EUR"
              )} ${
                value.tva
                  ? ` - TVA ${
                      tvaOptions.find((a) => a.value === value.tva)?.label ||
                      "Aucune"
                    }`
                  : ""
              }`}
            />
            <Button
              onClick={(e) =>
                setMenu({
                  target: e.currentTarget,
                  menu: [
                    {
                      label: "Appliquer une réduction",
                      icon: (p) => <PercentBadgeIcon {...p} />,
                    },
                    {
                      label: "Article optionnel",
                      icon: (p) => <CheckCircleIcon {...p} />,
                    },
                    { type: "divider" },
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
              className="rounded-l-none shrink-0"
              icon={(p) => <EllipsisHorizontalIcon {...p} />}
            />
          </>
        )}
      </div>
      {!readonly && props.onRemove && (
        <Button
          theme="outlined"
          data-tooltip="Retirer la ligne"
          className="shrink-0 text-red-500 dark:text-red-500"
          icon={(p) => <TrashIcon {...p} />}
          onClick={() => {
            setDeleted(true);
            setTimeout(props.onRemove!, 300);
          }}
        />
      )}
      {readonly &&
        (props.invoice?.type === "supplier_quotes" ||
          props.invoice?.type === "quotes") && (
          <div className="w-20 shrink-0 flex items-center justify-end">
            {value.type !== "separation" && (
              <Tag
                noColor
                color={renderCompletion([value])[1]}
                size="xs"
                data-tooltip="Voir le stock"
                onClick={() => {
                  openCtrlK({
                    path: [
                      {
                        mode: "search",
                        options: {
                          entity: "stock_items",
                          internalQuery: {
                            [props.invoice?.type === "supplier_quotes"
                              ? "from_rel_supplier_quote"
                              : "for_rel_quote"]: props.invoice?.id,
                            article: value.article,
                          },
                        },
                      } as CtrlKPathType<StockItems>,
                    ],
                    selection: { entity: "", items: [] },
                  });
                }}
              >
                {renderCompletion([value], "ready", true)[0] > 100 && "⚠️"}
                {renderCompletion([value], "ready", true)[0]}%{" "}
              </Tag>
            )}
          </div>
        )}
    </div>
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
