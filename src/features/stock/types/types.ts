import { RestEntity } from "@features/utils/rest/types/types";

export type StockItems = RestEntity & {
  state:
    | "bought"
    | "stock"
    | "reserved"
    | "in_transit"
    | "delivered"
    | "depleted"; // In stock, Reserved, Delivered, Bought

  article: string;
  serial_number: string;
  type: "product" | "service" | "consumable" | ""; // product, service, consumable or inherited from the article
  original_quantity: number; // The quantity of the original stock item when it arrived

  quantity: number; // Quantity left for this item (because moved to another stock item or consumed)

  client: string; // The client who has this stock item or plan to have it
  for_rel_quote: string; // The quote or invoice this stock item is linked to
  from_rel_supplier_quote: string; // The supplier quote this stock item is from
  location: string; // The location of the stock item

  from_rel_original_stock_item: string; // When we split a stock item, we keep a reference to the original one

  notes: string;
  documents: string[];
  tags: string[];
  assigned: string[];
};

export type StockLocations = RestEntity & {
  type: "warehouse" | "shelf";
  name: string;
  parent: string;
};
