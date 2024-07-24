import { Tag } from "@atoms/badge/tag";
import { CtrlKAtom } from "@features/ctrlk/store";
import { CtrlKPathType } from "@features/ctrlk/types";
import { Invoices } from "@features/invoices/types/types";
import { StockItems } from "@features/stock/types/types";
import { CubeIcon, TruckIcon } from "@heroicons/react/16/solid";
import { useSetRecoilState } from "recoil";
import { renderCompletion } from "../../invoices-details";

export const CompletionTags = (props: {
  invoice: Invoices;
  lines: Invoices["content"];
  size?: "xs" | "sm";
}) => {
  const openCtrlK = useSetRecoilState(CtrlKAtom);

  const onClick = (query: string) => {
    openCtrlK({
      path: [
        {
          mode: "search",
          options: {
            entity: "stock_items",
            query,
            internalQuery: {
              [props.invoice?.type === "supplier_quotes"
                ? "from_rel_supplier_quote"
                : "for_rel_quote"]: props.invoice?.id,
              article:
                props.lines?.length === 1 ? props.lines[0].article : undefined,
            },
          },
        } as CtrlKPathType<StockItems>,
      ],
      selection: { entity: "", items: [] },
    });
  };

  return (
    <div className="-space-x-px flex">
      <Tag
        onClick={() => onClick('!state:"bought"')}
        className="rounded-r-none"
        noColor
        size={props.size || "xs"}
        data-tooltip="Reservé"
        icon={
          <CubeIcon
            className={`w-3 h-3 mr-1 text-${
              renderCompletion(props.lines)[1]
            }-500`}
          />
        }
      >
        {renderCompletion(props.lines, "ready", true)[0] > 100 && "⚠️"}
        {renderCompletion(props.lines, "ready", true)[0]}%{" "}
      </Tag>
      <Tag
        onClick={() => onClick('state:"delivered","depleted"')}
        className="rounded-l-none"
        noColor
        size={props.size || "xs"}
        data-tooltip="Livré"
        icon={
          <TruckIcon
            className={`w-3 h-3 mr-1 text-${
              renderCompletion(props.lines)[1]
            }-500`}
          />
        }
      >
        {renderCompletion(props.lines, "delivered", true)[0] > 100 && "⚠️"}
        {renderCompletion(props.lines, "delivered", true)[0]}%{" "}
      </Tag>
    </div>
  );
};
