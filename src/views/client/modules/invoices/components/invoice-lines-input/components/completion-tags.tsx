import { Tag } from "@atoms/badge/tag";
import { CtrlKAtom } from "@features/ctrlk/store";
import { CtrlKPathType } from "@features/ctrlk/types";
import { Invoices } from "@features/invoices/types/types";
import { StockItems } from "@features/stock/types/types";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CubeIcon,
  TruckIcon,
} from "@heroicons/react/16/solid";
import { useSetRecoilState } from "recoil";
import { renderStockCompletion } from "../../invoices-details";
import { twMerge } from "tailwind-merge";
import _ from "lodash";
import { frequencyOptions } from "@views/client/modules/articles/components/article-details";

export const CompletionTags = (props: {
  invoice: Invoices;
  lines: Invoices["content"];
  size?: "xs" | "sm";
  short?: boolean;
  overflow?: boolean;
}) => {
  const readyServiceCompletion = renderStockCompletion(
    props.lines,
    "delivered",
    props.overflow,
    true
  );
  const readyCompletion = renderStockCompletion(
    props.lines,
    "ready",
    props.overflow
  );
  const deliveredCompletion = renderStockCompletion(
    props.lines,
    "delivered",
    props.overflow
  );

  const openCtrlK = useSetRecoilState(CtrlKAtom);

  const onClick = (entity: string, query: string) => {
    openCtrlK((states) => [
      ...states,
      {
        path: [
          {
            mode: "search",
            options: {
              entity,
              query,
              internalQuery: {
                [props.invoice?.type === "supplier_quotes"
                  ? "from_rel_supplier_quote"
                  : "for_rel_quote"]: props.invoice?.id,
                article:
                  props.lines?.length === 1
                    ? props.lines[0].article
                    : undefined,
              },
            },
          } as CtrlKPathType<StockItems>,
        ],
        selection: { entity: "", items: [] },
      },
    ]);
  };

  const shortLeft =
    props.short && (readyCompletion[0] >= 100 || deliveredCompletion[0] >= 100);
  const shortRight = props.short && !shortLeft;

  return (
    <div className="-space-x-px flex">
      {(props?.lines || []).some((a) => a.subscription) &&
        _.uniq(
          (props?.lines || [])?.map((a) => a.subscription).filter(Boolean)
        ).map((s) => (
          <Tag
            color="blue"
            size={props.size || "xs"}
            className={twMerge("mr-1")}
            icon={
              <ArrowPathIcon
                className={`w-3 h-3 mr-1 shrink-0 text-blue-500`}
              />
            }
          >
            {frequencyOptions.find((a) => a.value === s)?.label || s}
          </Tag>
        ))}
      {props?.lines?.some((a) => a.type === "service" && !a.subscription) && (
        <Tag
          onClick={() => onClick("service_items", 'state:"done"')}
          className={twMerge("mr-1", shortLeft && "w-5")}
          noColor
          size={props.size || "xs"}
          data-tooltip={"Executé " + readyServiceCompletion[0] + "%"}
          icon={
            <CheckCircleIcon
              className={`w-3 h-3 mr-1 shrink-0 text-${readyServiceCompletion[1]}-500`}
            />
          }
        >
          {!shortLeft && (
            <>
              {readyServiceCompletion[0] > 100 && "⚠️"}
              {readyServiceCompletion[0]}%{" "}
            </>
          )}
          {shortLeft && <div />}
        </Tag>
      )}
      {props?.lines?.some(
        (a) =>
          (a.type === "product" || a.type === "consumable") && !a.subscription
      ) && (
        <>
          {props.invoice?.type !== "supplier_quotes" && (
            <Tag
              onClick={() => onClick("stock_items", "")}
              className={twMerge("rounded-r-none", shortLeft && "w-5")}
              noColor
              size={props.size || "xs"}
              data-tooltip={"Reservé " + readyCompletion[0] + "%"}
              icon={
                <CubeIcon
                  className={`w-3 h-3 mr-1 shrink-0 text-${readyCompletion[1]}-500`}
                />
              }
            >
              {!shortLeft && (
                <>
                  {readyCompletion[0] > 100 && "⚠️"}
                  {readyCompletion[0]}%{" "}
                </>
              )}
              {shortLeft && <div />}
            </Tag>
          )}
          <Tag
            onClick={() =>
              onClick("stock_items", 'state:"delivered","depleted"')
            }
            className={twMerge(
              props.invoice?.type !== "supplier_quotes" && "rounded-l-none",
              shortRight && "w-5"
            )}
            noColor
            size={props.size || "xs"}
            data-tooltip={"Livré " + deliveredCompletion[0] + "%"}
            icon={
              <TruckIcon
                className={`w-3 h-3 mr-1 shrink-0 text-${deliveredCompletion[1]}-500`}
              />
            }
          >
            {!shortRight && (
              <>
                {deliveredCompletion[0] > 100 && "⚠️"}
                {deliveredCompletion[0]}%{" "}
              </>
            )}
            {shortRight && <div />}
          </Tag>
        </>
      )}
    </div>
  );
};
