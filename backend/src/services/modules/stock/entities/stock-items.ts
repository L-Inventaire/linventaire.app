import _ from "lodash";
import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";
import { flattenKeys } from "../../../utils";

/**
 * Stock:
 * Si 500 feuilles reçues
 * Ajout d’une ligne stock avec quantité 500 aucun client associé et « en stock »
 * Si j’en donne 100 a un client alors je duplique cette ligne, met un lien vers le parent, et je me retrouve avec 400 « en stock » et 100 « associé à un client »
 * Si la ligne de stock est un « consommable » ou « service » alors ce qui est « chez le client » ou à zéro n’est plus visible (mais toujours présent en bdd)
 * On peut surcharger l’info type consolable / service / stockable
 * Champ « de quelle commande ça vient »
 * On rajoute le champ « dans le cadre de » qui contient le devis associé (un seul, sinon faut dupliquer le stock)
 */
export default class StockItems extends RestEntity {
  state:
    | "bought"
    | "stock"
    | "reserved"
    | "in_transit"
    | "delivered"
    | "depleted" = "bought"; // Bought, In stock, Reserved, In Transit, Delivered, Depleted (for consumables)

  article = "type:articles";
  serial_number = "string";
  type: "product" | "service" | "consumable" | "" = ""; // product, service, consumable or inherited from the article
  quantity = 0; // Usually equal to initial_quantity: quantity left for this item (because moved to another stock item or consumed)

  client = "type:contacts"; // The client who has this stock item or plan to have it
  for_rel_quote = "type:invoices"; // The quote or invoice this stock item is linked to
  for_rel_quote_content_index = 0;
  from_rel_supplier_quote = "type:invoices"; // The supplier quote this stock item is from
  location = "type:stock_locations"; // The location of this stock item, like which shelf or warehouse

  from_rel_original_stock_items = ["type:stock_items"]; // When we split a stock item, we keep a reference to the original one

  assigned = ["type:users"];
  notes = "string";
  documents = ["type:files"]; // Internal documents linked to the stock_item
  tags = ["type:tags"];

  cache = {
    article_name: "string",
    client_name: "string",
    quote_name: "string",
    supplier_quote_name: "string",
  };
}

export const StockItemsDefinition: RestTableDefinition = {
  name: "stock_items",
  columns: {
    ...columnsFromEntity(StockItems),
    ...new RestEntityColumnsDefinition(),
    notes: "TEXT",
    state_order:
      "BIGINT GENERATED ALWAYS AS (CASE state WHEN 'bought' THEN 1 WHEN 'stock' THEN 2 WHEN 'reserved' THEN 3 WHEN 'in_transit' THEN 4 WHEN 'delivered' THEN 5 WHEN 'depleted' THEN 6 ELSE 7 END) STORED",
  },
  pk: ["client_id", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    label: (entity: StockItems) => entity.serial_number,
    searchable: (entity: StockItems) => {
      return [
        ...Object.values(flattenKeys(_.pick(entity, ["serial_number"]))),
        (entity.serial_number || "").split("").reverse().join(""),
        entity.cache?.article_name || "",
        entity.cache?.client_name || "",
        entity.cache?.quote_name || "",
        entity.cache?.supplier_quote_name || "",
      ].join(" ");
    },
    schema: classToSchema(new StockItems()),
  },
};

export const StockItemsSchema = schemaFromEntity<StockItems>(
  StockItemsDefinition.columns
);
