import { Button } from "@atoms/button/button";
import { DropDownAtom } from "@atoms/dropdown";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormContextContext } from "@components/form/formcontext";
import {
  InputButton,
  InputButtonIsOpenAtom,
} from "@components/input-button";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { formatAmount, getTextFromHtml } from "@features/utils/format/strings";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CurrencyEuroIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { EditorInput } from "@molecules/editor-input";
import { Text } from "@radix-ui/themes";
import { computeGroupTotal } from "@shared/invoices";
import _ from "lodash";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useDrag, useDragLayer, useDrop } from "react-dnd";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { setGroupHidePricesPreference } from "./groups";
import { INVOICE_GROUP_DND, INVOICE_LINE_DND } from "./invoice-line-input";

export const InvoiceGroupInput = (props: {
  invoice: Invoices;
  value: InvoiceLine; // Header of the group
  lines: InvoiceLine[]; // Lines of the group
  onChange: (header: InvoiceLine) => void;
  onAddLine: () => void;
  autoOpen?: boolean; // Open the group options on mount (newly created group)
  onDropLine: (line: InvoiceLine) => void; // A line is dropped in the empty group
  onRemove: (keepLines: boolean) => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  readonly?: boolean;
  children: ReactNode; // Rendered lines of the group (with their drop zones)
}) => {
  const formContext = useContext(FormContextContext);
  const readonly = props.readonly ?? formContext.readonly;
  const setMenu = useSetRecoilState(DropDownAtom);
  const { value, onChange } = props;
  const currency = props.invoice?.currency || "EUR";
  const optionsKey = useRef(_.uniqueId("invoice-group-"));
  const setOptionsOpen = useSetRecoilState(
    InputButtonIsOpenAtom(optionsKey.current),
  );

  const [{ dragging }, dragRef, previewRef] = useDrag(
    () => ({
      canDrag: !readonly,
      type: INVOICE_GROUP_DND,
      item: value,
      collect: (monitor) => ({ dragging: monitor.isDragging() }),
    }),
    [value, readonly],
  );
  const { otherDragging } = useDragLayer((monitor) => ({
    otherDragging: monitor.isDragging(),
  }));

  const [deleted, setDeleted] = useState(true);
  useEffect(() => {
    // Create animated entrance
    setDeleted(false);
  }, []);
  const remove = (keepLines: boolean) => {
    setDeleted(true);
    setTimeout(() => props.onRemove(keepLines), 300);
  };

  const total = computeGroupTotal(props.lines);

  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: INVOICE_LINE_DND,
      drop: (line: InvoiceLine) => props.onDropLine(line),
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    }),
    [props.onDropLine],
  );

  return (
    <div
      ref={previewRef}
      className={twMerge(
        "relative w-full mb-3 opacity-100 transition-all group/invoice-group",
        (deleted || dragging) && "max-h-0 opacity-0 !m-0 overflow-hidden",
      )}
    >
      <div>
        {/* Top of the "C": name of the group and options */}
        <div
          ref={dragRef}
          className={twMerge(
            "relative flex items-center gap-2 px-2 py-1 border rounded-lg rounded-bl-none bg-slate-50 dark:bg-slate-900 dark:border-slate-700",
            !readonly && "cursor-grab",
          )}
        >
          {!readonly && (
            <div
              className={twMerge(
                "absolute w-5 h-5 flex items-center justify-start opacity-0 group-hover/invoice-group:opacity-100 -left-5",
                otherDragging && !dragging && "opacity-0",
              )}
            >
              <EllipsisVerticalIcon className="w-4 h-4 opacity-25 -ml-0.5" />
              <EllipsisVerticalIcon className="w-4 h-4 opacity-25 -ml-3" />
            </div>
          )}
          <div className="grow min-w-0">
            <InputButton
              btnKey={optionsKey.current}
              theme="invisible"
              readonly={readonly}
              size="sm"
              className="m-0 max-w-full justify-start text-left"
              label="Groupe d'articles"
              placeholder="Nom du groupe"
              autoFocus={props.autoOpen}
              value={value.name || "Groupe d'articles"}
              content={() => (
                <InvoiceGroupOptionsInput value={value} onChange={onChange} />
              )}
              footer={({ close }) => (
                <div className="flex gap-2 mt-4">
                  <Button
                    theme="secondary"
                    size="md"
                    onClick={close}
                    shortcut={["esc"]}
                  >
                    Fermer
                  </Button>
                  <Button
                    size="md"
                    icon={(p) => <PlusIcon {...p} />}
                    onClick={() => {
                      close();
                      props.onAddLine();
                    }}
                  >
                    Ajouter des articles
                  </Button>
                </div>
              )}
            >
              <div className="min-w-0">
                <Text as="div" size="2" weight="bold" className="truncate">
                  {value.name || "Groupe d'articles"}
                </Text>
                {!!getTextFromHtml(value.description || "").trim() && (
                  <Text
                    as="div"
                    size="2"
                    color="gray"
                    className="font-normal line-clamp-2 whitespace-pre-line"
                  >
                    {getTextFromHtml(value.description || "")}
                  </Text>
                )}
              </div>
            </InputButton>
          </div>
          {!readonly && (
            <Button
              theme="invisible"
              size="xs"
              data-tooltip="Options du groupe"
              icon={(p) => <EllipsisHorizontalIcon {...p} />}
              onClick={(e) =>
                setMenu({
                  target: e.currentTarget,
                  menu: [
                    {
                      label: "Modifier le groupe",
                      icon: (p) => <PencilIcon {...p} />,
                      onClick: () => setOptionsOpen(true),
                    },
                    {
                      label: value.group_hide_prices
                        ? "Afficher le prix des lignes"
                        : "Masquer le prix des lignes",
                      icon: (p) => <CurrencyEuroIcon {...p} />,
                      onClick: () => {
                        setGroupHidePricesPreference(!value.group_hide_prices);
                        onChange({
                          ...value,
                          group_hide_prices: !value.group_hide_prices,
                        });
                      },
                    },
                    { type: "divider" },
                    {
                      label: "Dupliquer le groupe",
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
                    { type: "divider" },
                    {
                      label: "Supprimer (garder les articles)",
                      icon: (p) => <TrashIcon {...p} />,
                      onClick: () => remove(true),
                    },
                    {
                      type: "danger",
                      label: "Supprimer avec les articles",
                      icon: (p) => <TrashIcon {...p} />,
                      onClick: () => remove(false),
                    },
                  ],
                })
              }
            />
          )}
        </div>

        {/* Center of the "C": lines of the group */}
        <div className="flow-root pl-3 pt-3 border-l dark:border-slate-700">
          {!props.lines.length && (
            <div
              ref={dropRef}
              className={twMerge(
                "mb-3 p-3 border border-dashed rounded-md text-center dark:border-slate-700 transition-colors",
                isOver && "border-blue-400 bg-blue-50 dark:bg-blue-950",
              )}
            >
              <Info>
                Glissez des lignes ici ou ajoutez-en une nouvelle au groupe.
              </Info>
            </div>
          )}
          {props.children}
          {!readonly && (
            <div className="text-right mb-3">
              <Button
                theme="outlined"
                size="sm"
                className="m-0"
                icon={(p) => <PlusIcon {...p} />}
                onClick={props.onAddLine}
              >
                Ajouter une ligne au groupe
              </Button>
            </div>
          )}
        </div>

        {/* Bottom of the "C": subtotal */}
        <div className="flex items-center justify-end px-3 py-1 border rounded-lg rounded-tl-none bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
          <div className="text-right">
            <Text as="div" size="2">
              {formatAmount(total.total.toFixed(2), currency)} HT
            </Text>
            {total.total_with_taxes !== total.total && (
              <Text as="div" size="2" weight="bold">
                {formatAmount(total.total_with_taxes.toFixed(2), currency)} TTC
              </Text>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoiceGroupOptionsInput = ({
  value,
  onChange,
}: {
  value: InvoiceLine;
  onChange: (v: InvoiceLine) => void;
}) => {
  return (
    <div className="space-y-4">
      <FormInput
        size="md"
        autoFocus
        autoSelect
        label="Intitulé du groupe"
        value={value.name}
        onChange={(name) => onChange({ ...value, name })}
      />
      <InputLabel
        label="Description"
        input={
          <EditorInput
            placeholder="Description (optionnelle)"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
          />
        }
      />
      <Checkbox
        size="sm"
        label="Masquer le prix des lignes (seul le total du groupe est affiché)"
        value={!!value.group_hide_prices}
        onChange={(group_hide_prices) => {
          setGroupHidePricesPreference(group_hide_prices);
          onChange({ ...value, group_hide_prices });
        }}
      />
    </div>
  );
};
