import { Button } from "@atoms/button/button";
import { Input } from "@atoms/input/input-text";
import { Info } from "@atoms/text";
import { formatAmount } from "@features/utils/format/strings";
import { TruckIcon, ViewColumnsIcon } from "@heroicons/react/16/solid";
import { Text } from "@radix-ui/themes";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { FurnishQuotesFurnish } from "../../../types";

// Component for the action buttons in the footer
export const ActionButtons = ({
  articleId,
  onAddSupplier,
  onAddStock,
}: {
  articleId: string;
  onAddSupplier: (articleId: string) => void;
  onAddStock: (articleId: string) => void;
}) => {
  return (
    <div className="mt-4 w-full">
      <Button
        theme="invisible"
        size="sm"
        className="mb-2 flex"
        onClick={() => onAddSupplier(articleId)}
        icon={(props) => <TruckIcon {...props} />}
        data-tooltip="Ajouter un fournisseur pour ce produit"
      >
        Ajouter un fournisseur
      </Button>
      <Button
        size="sm"
        theme="invisible"
        onClick={() => onAddStock(articleId)}
        icon={(props) => <ViewColumnsIcon {...props} />}
        data-tooltip="Ajouter un élément de stock"
      >
        Ajouter au stock
      </Button>
    </div>
  );
};

// Component for the quantity slider
export const QuantitySlider = ({
  title,
  supplierDetails,
  furnish,
  furnishText,
  maxFurnishable,
  onSetQuantity,
}: {
  title?: string;
  supplierDetails?: {
    reference?: string;
    price?: number;
    delivery_time?: number;
    delivery_quantity?: number;
  };
  furnish: FurnishQuotesFurnish;
  furnishText: { ref: string; value: string } | undefined;
  maxFurnishable: number;
  onSetQuantity: (fur: FurnishQuotesFurnish, value: number) => void;
}) => {
  return (
    <div className="bg-slate-25 p-2 rounded-md">
      <Text>{title}</Text>
      {supplierDetails && (
        <Info className="ml-2">
          {[
            supplierDetails.reference &&
              `Référence: ${supplierDetails.reference}`,
            supplierDetails.price &&
              `Prix: ${formatAmount(supplierDetails.price)}`,
            supplierDetails.delivery_quantity &&
              `Lots de ${supplierDetails.delivery_quantity}`,
            supplierDetails.delivery_time &&
              `Livraison ${supplierDetails.delivery_time}j`,
          ]
            .filter(Boolean)
            .join(" - ")}
        </Info>
      )}
      <div className="flex w-full items-center justify-between mt-1">
        <Input
          placeholder="0"
          value={parseInt(furnishText?.value || "0") || ""}
          onChange={(e) => {
            const value = parseInt(e.target.value || "0");
            if (!_.isNaN(value)) {
              onSetQuantity(furnish, value);
            }
          }}
          type="text"
          pattern="^[0-9]*$"
          size="md"
          min={0}
          className={twMerge("grow mr-3")}
        />
        <div className="flex items-center space-x-1">
          <Text className="text-slate-600 font-medium">sur</Text>
          <Text className="font-bold">{maxFurnishable}</Text>
        </div>
      </div>
    </div>
  );
};
