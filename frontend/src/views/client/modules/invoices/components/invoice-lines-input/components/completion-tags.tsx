import { Tag } from "@atoms/badge/tag";
import { DropdownButton, DropDownMenuType } from "@atoms/dropdown";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { CtrlKAtom } from "@features/ctrlk/store";
import { CtrlKPathType } from "@features/ctrlk/types";
import { Invoices } from "@features/invoices/types/types";
import { StockItems } from "@features/stock/types/types";
import { getRestApiClient } from "@features/utils/rest/hooks/use-rest";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CubeIcon,
  TruckIcon,
} from "@heroicons/react/16/solid";
import { CheckCircleIcon as CheckCircleIconOutline } from "@heroicons/react/24/outline";
import { frequencyOptions } from "@views/client/modules/articles/components/article-details";
import _ from "lodash";
import toast from "react-hot-toast";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { renderStockCompletion } from "../../invoice-completions";
import { ServiceItems } from "@features/service/types/types";

export const CompletionTags = (props: {
  invoice: Invoices;
  lines: Invoices["content"];
  size?: "xs" | "sm";
  short?: boolean;
  overflow?: boolean;
}) => {
  const { id: clientId } = useCurrentClient();
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

  const hasServices = props?.lines?.some((a) => a.type === "service");
  const hasStock = props?.lines?.some(
    (a) => a.type === "product" || a.type === "consumable"
  );

  const options: DropDownMenuType = [
    {
      visible: hasStock && deliveredCompletion[0] < 100,
      icon: (p) => <CubeIcon {...p} />,
      label: "Voir le stock associé",
      onClick: (e) => {
        e.stopPropagation();
        onClick("stock_items", "");
      },
    },
    {
      visible: hasStock,
      icon: (p) => <TruckIcon {...p} />,
      label: "Voir le stock associé livré",
      onClick: (e) => {
        e.stopPropagation();
        onClick(
          "stock_items",
          props.invoice?.type === "supplier_quotes"
            ? ""
            : 'state:"delivered","depleted"'
        );
      },
    },
    {
      type: "divider",
    },
    {
      visible: hasServices && readyServiceCompletion[0] < 100,
      icon: (p) => <CheckCircleIconOutline {...p} />,
      label: "Voir les services associés",
      onClick: (e) => {
        e.stopPropagation();
        onClick("service_items", "");
      },
    },
    {
      visible: hasServices,
      icon: (p) => <CheckCircleIcon {...p} />,
      label: "Voir les services associés exécutés",
      onClick: (e) => {
        e.stopPropagation();
        onClick("service_items", 'state:"done"');
      },
    },
    {
      type: "divider",
    },
    {
      visible: hasStock && deliveredCompletion[0] < 100,
      label: "Marquer tout le stock comme livré",
      onClick: (e) => {
        e.stopPropagation();
        toast.promise(
          (async () => {
            try {
              if (!props.invoice?.id || !clientId) {
                throw new Error("Invoice or client ID is missing");
              }
              const stockItems = await getRestApiClient("stock_items").list(
                clientId!,
                buildQueryFromMap({
                  for_rel_quote: props.invoice?.id,
                  state: ["bought", "stock", "reserved", "in_transit"],
                  article: (props.lines || [])
                    .map((a) => a.article)
                    .filter(Boolean),
                }),
                { limit: 1000 }
              );
              for (const stockItem of stockItems.list) {
                await getRestApiClient("stock_items").update(
                  clientId!,
                  {
                    state: "delivered",
                  },
                  stockItem.id
                );
              }
            } catch (error) {
              console.error("Error marking stock as delivered:", error);
              throw error;
            }
          })(),
          {
            loading: "Modification en cours...",
            success: "Stock marqué comme livré",
            error: "Erreur lors du marquage du stock",
          }
        );
      },
    },
    {
      visible: hasServices && readyServiceCompletion[0] < 100,
      label: "Compléter les services",
      onClick: (e) => {
        e.stopPropagation();
        toast.promise(
          (async () => {
            if (!props.invoice?.id || !clientId) {
              throw new Error("Invoice or client ID is missing");
            }
            for (const line of props.lines || []) {
              if (line.type === "service") {
                const completed = renderStockCompletion(
                  [line],
                  "delivered",
                  props.overflow,
                  true
                );
                const quantity = completed[2];
                if (quantity > 0) {
                  // Create a new service item to mark it as done
                  const serviceItem = {
                    state: "done",
                    title: [
                      line.name,
                      line.description,
                      "Généré depuis " + props.invoice.reference,
                    ]
                      .filter(Boolean)
                      .join(" - "),
                    notes:
                      "Service marqué comme exécuté depuis le devis " +
                      props.invoice.reference,
                    for_rel_quote: props.invoice.id,
                    article: line.article,
                    client: props.invoice.client,
                    quantity_expected: quantity,
                    quantity_spent: quantity,
                  } as Partial<ServiceItems>;

                  await getRestApiClient("service_items").create(
                    clientId!,
                    serviceItem
                  );
                }
              }
            }
          })(),
          {
            loading: "Modification en cours...",
            success: "Services marqués comme exécutés",
            error: "Erreur lors du marquage des services",
          }
        );
      },
    },
  ];

  return (
    <DropdownButton
      menu={options}
      theme="invisible"
      className="p-0 m-0 cursor-pointer"
    >
      <div className="flex space-x-1">
        {props?.lines?.some((a) => a.type === "service") && (
          <Tag
            onClick={() => {}}
            className={twMerge(shortLeft && "w-5")}
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
          (a) => a.type === "product" || a.type === "consumable"
        ) && (
          <div className="flex -space-x-px">
            {props.invoice?.type !== "supplier_quotes" && (
              <Tag
                onClick={() => {}}
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
              onClick={() => {}}
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
          </div>
        )}
        {(props?.lines || []).some((a) => a.subscription) &&
          _.uniq(
            (props?.lines || [])?.map((a) => a.subscription).filter(Boolean)
          ).map((s) => (
            <Tag
              color="blue"
              size={props.size || "xs"}
              icon={
                <ArrowPathIcon
                  className={`w-3 h-3 mr-1 shrink-0 text-blue-500`}
                />
              }
            >
              {frequencyOptions.find((a) => a.value === s)?.label || s}
            </Tag>
          ))}
      </div>
    </DropdownButton>
  );
};
