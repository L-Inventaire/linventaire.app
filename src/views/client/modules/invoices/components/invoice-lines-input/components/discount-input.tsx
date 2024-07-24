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

export const InvoiceDiscountInput = (props: {
  value?: InvoiceLine["discount"];
  onChange?: (v: InvoiceLine["discount"] | undefined) => void;
  ctrl?: FormControllerType<InvoiceLine["discount"]>;
}) => {
  const value =
    props.ctrl?.value || props.value || ({} as InvoiceLine["discount"]);
  const onChange = props.ctrl?.onChange || props.onChange;
  const { ctrl } = useFormController(value!, (e) => onChange!(e(value)));

  return (
    <div className="space-y-2">
      <FormInput
        autoFocus
        label={"Type de réduction"}
        ctrl={ctrl("mode")}
        type="select"
        options={[
          { value: "percentage", label: "Pourcentage" },
          { value: "amount", label: "Montant fixe" },
        ]}
      />
      <FormInput
        label="Réduction"
        ctrl={ctrl(`value`)}
        type="formatted"
        format={ctrl("mode").value === "amount" ? "price" : "percentage"}
      />

      <Info className="block mt-2">
        <Link
          onClick={() => {
            onChange!(undefined);
          }}
        >
          Ne pas appliquer de réduction
        </Link>
      </Info>
    </div>
  );
};
