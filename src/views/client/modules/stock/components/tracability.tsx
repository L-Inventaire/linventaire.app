import { Unit } from "@atoms/input/input-unit";
import Link from "@atoms/link";
import { useArticle } from "@features/articles/hooks/use-articles";
import { getRoute, ROUTES } from "@features/routes";
import {
  useStockItem,
  useStockItems,
} from "@features/stock/hooks/use-stock-items";
import { StockItems } from "@features/stock/types/types";
import { Badge, Code } from "@radix-ui/themes";
import { PageBlock } from "@views/client/_layout/page";
import { twMerge } from "tailwind-merge";

/**
 * This component displays and help navigate in the origin and children of a stock item
 */
export const Tracability = ({ id }: { id: string }) => {
  const { stock_item: item } = useStockItem(id);
  const { stock_item: parent } = useStockItem(
    item?.from_rel_original_stock_item || ""
  );
  return (
    <PageBlock>
      <SubTracability
        parent={parent || item!}
        depth={0}
        maxDepth={3}
        current={id}
      />
    </PageBlock>
  );
};

const SubTracability = ({
  parent,
  depth,
  ...props
}: {
  parent: StockItems;
  depth: number;
  maxDepth: number;
  current?: string;
}) => {
  const { stock_items: children } = useStockItems({
    query: {
      from_rel_original_stock_item: parent.id || "nothing",
    },
  });
  const { article } = useArticle(parent.article || "");

  return (
    <div>
      <Link
        noColor
        className={twMerge(
          "px-2 my-1 block bg-slate-500 bg-opacity-20 dark:bg-opacity-20 rounded cursor-pointer hover:bg-opacity-30",
          parent.id === props.current ? "bg-blue-500 rounded" : ""
        )}
        to={getRoute(ROUTES.StockView, { id: parent.id || "" })}
      >
        <div className="flex flex-row items-center space-x-2">
          {depth === 0 && parent.from_rel_original_stock_item && <>...</>}
          <Code>{parent?.serial_number}</Code>{" "}
          <div className="grow text-ellipsis inline-block overflow-hidden whitespace-nowrap">
            {article?.name}
          </div>
          <Badge>
            {parent?.quantity} <Unit unit={article?.unit} />
          </Badge>
        </div>
      </Link>
      <div className="border-l-2 border-gray-200 pl-2">
        {depth < props.maxDepth &&
          children?.data?.list.map((child) => (
            <div key={child.id}>
              <SubTracability parent={child} depth={depth + 1} {...props} />
            </div>
          ))}
      </div>
    </div>
  );
};
