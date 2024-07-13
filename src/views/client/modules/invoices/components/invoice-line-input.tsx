import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { Input } from "@atoms/input/input-text";
import {
  InputOutlinedDefault,
  InputOutlinedHighlight,
} from "@atoms/styles/inputs";
import { Base, Info } from "@atoms/text";
import {
  FormContextContext,
  FormControllerType,
} from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { RestDocumentsInput } from "@components/input-rest";
import { useArticle } from "@features/articles/hooks/use-articles";
import { Articles } from "@features/articles/types/types";
import { InvoiceLine } from "@features/invoices/types/types";
import { getTextFromHtml } from "@features/utils/format/strings";
import {
  BanknotesIcon,
  Bars3BottomLeftIcon,
  BriefcaseIcon,
  ChevronDoubleUpIcon,
  CubeIcon,
  CubeTransparentIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  HashtagIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { EditorInput } from "@molecules/editor-input";
import { ReactNode, useContext, useEffect, useState } from "react";
import { useDrag, useDragLayer, useDrop } from "react-dnd";
import { twMerge } from "tailwind-merge";

export const InvoiceLineInput = (props: {
  value?: InvoiceLine;
  onChange?: (v: InvoiceLine) => void;
  ctrl?: FormControllerType<InvoiceLine>;
  onRemove?: () => void;
  readonly?: boolean;
}) => {
  const formContext = useContext(FormContextContext);

  const value = props.ctrl?.value || props.value || ({} as InvoiceLine);
  const onChange = props.ctrl?.onChange || props.onChange;
  const readonly = props.readonly ?? formContext.readonly;

  const { article } = useArticle(value.article || "");

  const percentDone = value.quantity
    ? ((value.quantity_ready || 0) / value.quantity) * 100
    : 0;

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
          className={twMerge("grow text-left justify-start")}
          placeholder={value.type !== "separation" ? "Article" : "Texte libre"}
          icon={(p) =>
            value.type === "separation" ? (
              <Bars3BottomLeftIcon {...p} />
            ) : (
              <CubeIcon {...p} />
            )
          }
          empty="Vide"
          content={<InvoiceLineArticleInput {...props} />}
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
              icon={(p) => <HashtagIcon {...p} />}
            />
            <InputButton
              className="rounded-none shrink-0"
              label="Prix"
              placeholder="Prix"
              icon={(p) => <BanknotesIcon {...p} />}
            />
            <InputButton
              className="rounded-l-none shrink-0"
              label="TVA"
              placeholder="TVA"
              icon={(p) => <ChevronDoubleUpIcon {...p} />}
            />
            <InputButton
              data-tooltip="Options"
              className="rounded-l-none shrink-0"
              label="Options"
              placeholder="Options"
              icon={(p) => <EllipsisHorizontalIcon {...p} />}
            />
          </>
        )}
      </div>
      {!readonly && props.onRemove && (
        <Button
          theme="outlined"
          data-tooltip="Retirer la ligne"
          className="shrink-0 text-red-500"
          icon={(p) => <TrashIcon {...p} />}
          onClick={() => {
            setDeleted(true);
            setTimeout(props.onRemove!, 300);
          }}
        />
      )}
      {readonly && (
        <div className="w-16 shrink-0 flex items-center justify-end">
          {value.type !== "separation" && (
            <Tag noColor color="orange" size="xs">
              {percentDone}%
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

const InvoiceLineArticleInput = (props: {
  value?: InvoiceLine;
  onChange?: (v: InvoiceLine) => void;
  ctrl?: FormControllerType<InvoiceLine>;
}) => {
  const value = props.ctrl?.value || props.value || ({} as InvoiceLine);
  const onChange = props.ctrl?.onChange || props.onChange;

  const { article } = useArticle(value.article || "");

  return (
    <>
      <div className="space-x-2 mb-4 flex">
        <RadioCard
          title={"Article ou service"}
          value={value.type !== "separation"}
          onClick={() => onChange?.({ ...value, type: "product" })}
        />
        <RadioCard
          title={"Texte libre"}
          value={value.type === "separation"}
          onClick={() =>
            onChange?.({ ...value, type: "separation", article: "" })
          }
        />
      </div>

      <div className="space-y-2">
        {value.type !== "separation" && (
          <RestDocumentsInput
            size="xl"
            entity="articles"
            label="Choisir un article"
            icon={(p) =>
              article?.type === "service" ? (
                <BriefcaseIcon {...p} />
              ) : article?.type === "consumable" ? (
                <CubeTransparentIcon {...p} />
              ) : (
                <CubeIcon {...p} />
              )
            }
            value={value.article}
            onChange={(id, article: Articles | null) =>
              onChange?.(
                article
                  ? {
                      ...value,
                      article: id as string,
                      name: article.name,
                      description: article.description,
                      type: article.type,
                      tva: article.tva,
                      unit_price: article.price,
                      unit: article.unit || "unit",
                    }
                  : { ...value, article: "" }
              )
            }
          />
        )}

        <Input
          value={value.name}
          onChange={(e) => onChange?.({ ...value, name: e.target.value })}
        />

        <EditorInput
          placeholder="Texte libre"
          value={value.description}
          onChange={(description) => onChange?.({ ...value, description })}
        />
      </div>
    </>
  );
};

const RadioCard = (props: {
  value?: boolean;
  onClick?: () => void;
  title?: ReactNode | string;
  text?: ReactNode | string;
}) => {
  return (
    <div
      className={twMerge(
        "w-full flex items-center cursor-pointer",
        InputOutlinedDefault,
        props.value && InputOutlinedHighlight
      )}
      onClick={props.onClick}
    >
      <div>
        <div
          className={twMerge(
            "w-4 h-4 rounded-full mx-2 flex items-center justify-center",
            props.value && "border border-wood-500",
            !props.value && "border border-slate-100 dark:border-slate-700"
          )}
        >
          {props.value && (
            <div className="rounded-full bg-wood-500 w-2.5 h-2.5" />
          )}
        </div>
      </div>
      <div className="w-full py-2 text-sm">
        {props.title && <Base className="block">{props.title}</Base>}
        {props.text && <Info>{props.text}</Info>}
      </div>
    </div>
  );
};
