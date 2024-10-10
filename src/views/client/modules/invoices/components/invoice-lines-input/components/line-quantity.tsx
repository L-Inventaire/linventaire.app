import { InputUnit } from "@atoms/input/input-unit";
import Link from "@atoms/link";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  FormControllerType,
  useFormController,
} from "@components/form/formcontext";
import { Articles } from "@features/articles/types/types";
import { InvoiceLine } from "@features/invoices/types/types";
import { Heading } from "@radix-ui/themes";
import { frequencyOptions } from "@views/client/modules/articles/components/article-details";

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
      <div className="space-y-1">
        <Heading size="2">Unité</Heading>
        <InputUnit
          className="w-full"
          value={ctrl("unit").value}
          onValueChange={ctrl("unit").onChange}
        />
      </div>

      <FormInput
        type="select"
        label="Renouvellement"
        placeholder="Sélectionner une fréquence"
        ctrl={ctrl("subscription")}
        options={frequencyOptions}
      />

      <Info className="block mt-2">
        <Link
          onClick={() => {
            onChange!({
              ...value,
              unit: props?.article?.unit,
            });
          }}
        >
          Utiliser les données de l'article
        </Link>
      </Info>
    </div>
  );
};
