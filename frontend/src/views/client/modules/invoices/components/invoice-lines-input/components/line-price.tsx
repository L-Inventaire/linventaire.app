import Link from "@atoms/link";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { Articles } from "@features/articles/types/types";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { useInvoiceMaps } from "@features/invoices/hooks/use-invoice-maps";
import { useMarginMode } from "@features/clients/state/use-clients";
import { getArticleMaxCost } from "@features/articles/utils";
import { MarginInput } from "@views/client/modules/articles/components/margin-input";
import { getCorrectPrice, isSellDocument } from "../invoice-line-input";

export const InvoiceLinePriceInput = (props: {
  article?: Articles | null;
  value?: InvoiceLine;
  onChange?: (v: InvoiceLine) => void;
  ctrl?: FormControllerType<InvoiceLine>;
  invoice: Invoices;
}) => {
  const value = props.ctrl?.value || props.value || ({} as InvoiceLine);
  const onChange = props.ctrl?.onChange || props.onChange;
  const { ctrl } = useFormController(value, (e) => onChange!(e(value)));
  const { tvaOptions } = useInvoiceMaps();
  const showMargin =
    useMarginMode() &&
    isSellDocument(props.invoice) &&
    value.type !== "correction";

  return (
    <div className="space-y-2">
      <FormInput
        label={"Prix unitaire HT"}
        ctrl={ctrl("unit_price")}
        type="formatted"
        format="price"
        autoSelect
        autoFocus
      />
      {showMargin && (
        <MarginInput
          price={value.unit_price}
          cost={getArticleMaxCost(props.article)}
          onPriceChange={(price) => onChange!({ ...value, unit_price: price })}
          showHelp
        />
      )}
      <FormInput
        label="TVA"
        type="select"
        ctrl={ctrl(`tva`)}
        options={tvaOptions}
      />
      {value.type !== "correction" && (
        <Info className="block !mt-4">
          <Link
            onClick={() => {
              onChange!({
                ...value,
                unit_price: getCorrectPrice(props!.article!, props!.invoice),
                tva: props?.article?.tva || "S:20",
              });
            }}
          >
            Utiliser le prix de l'article
          </Link>
        </Info>
      )}
    </div>
  );
};
