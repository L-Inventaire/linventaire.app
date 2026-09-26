import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  getMarginFromPrice,
  getPriceFromMargin,
} from "@features/articles/utils";
import { useMarginBase } from "@features/clients/state/use-clients";
import { formatAmount } from "@features/utils/format/strings";

/**
 * Margin input (in %, on the cost or the sell price depending on the
 * client preferences) linked to a price:
 * changing the margin updates the price and vice versa.
 */
export const MarginInput = ({
  price,
  cost,
  onPriceChange,
  readonly,
  className,
  showHelp,
}: {
  price: number | string;
  cost: number | null;
  onPriceChange: (price: number) => void;
  readonly?: boolean;
  className?: string;
  showHelp?: boolean;
}) => {
  const base = useMarginBase();
  const margin = getMarginFromPrice(price, cost, base);
  return (
    <div className={className}>
      <FormInput
        label="Marge"
        type="formatted"
        format="percentage"
        readonly={readonly}
        disabled={!cost}
        placeholder={!cost ? "Coût inconnu" : "Marge"}
        value={margin === null ? "" : margin.toString()}
        onChange={(v) => {
          const newPrice = getPriceFromMargin(v, cost, base);
          if (newPrice !== null) onPriceChange(newPrice);
        }}
      />
      {showHelp && (
        <Info className="block mt-1">
          {!cost
            ? "Aucun coût connu pour cet article : définissez un prix d'achat fournisseur pour calculer la marge."
            : `Marge calculée ${
                base === "price" ? "sur le prix de vente" : "sur le coût"
              }, à partir du prix d'achat le plus élevé (${formatAmount(
                cost,
              )} HT).`}
        </Info>
      )}
    </div>
  );
};
