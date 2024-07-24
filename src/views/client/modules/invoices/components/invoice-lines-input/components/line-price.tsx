import Link from "@atoms/link";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { Articles } from "@features/articles/types/types";
import { InvoiceLine } from "@features/invoices/types/types";
import { tvaOptions } from "@features/utils/constants";

export const InvoiceLinePriceInput = (props: {
  article?: Articles | null;
  value?: InvoiceLine;
  onChange?: (v: InvoiceLine) => void;
  ctrl?: FormControllerType<InvoiceLine>;
}) => {
  const value = props.ctrl?.value || props.value || ({} as InvoiceLine);
  const onChange = props.ctrl?.onChange || props.onChange;
  const { ctrl } = useFormController(value, (e) => onChange!(e(value)));

  return (
    <div className="space-y-2">
      <FormInput
        autoFocus
        label={"Prix unitaire HT"}
        ctrl={ctrl("unit_price")}
        type="formatted"
        format="price"
      />
      <FormInput label="TVA" ctrl={ctrl(`tva`)} options={tvaOptions} />

      <Info className="block !mt-4">
        <Link
          onClick={() => {
            onChange!({
              ...value,
              unit_price: props?.article?.price,
              tva: props?.article?.tva,
            });
          }}
        >
          Utiliser le prix de l'article
        </Link>
      </Info>
    </div>
  );
};
