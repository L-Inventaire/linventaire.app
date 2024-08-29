import Link from "@atoms/link";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { Articles } from "@features/articles/types/types";
import { InvoiceLine } from "@features/invoices/types/types";
import { unitOptions } from "@features/utils/constants";

export const InvoiceLineQuantityInput = (props: {
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
        label="Quantité"
        type="number"
        ctrl={ctrl("quantity")}
        autoSelect
      />
      <FormInput label="Unité" ctrl={ctrl(`unit`)} options={unitOptions} />

      <Info className="block mt-2">
        <Link
          onClick={() => {
            onChange!({
              ...value,
              unit: props?.article?.unit,
            });
          }}
        >
          Utiliser l'unité de l'article
        </Link>
      </Info>
    </div>
  );
};
