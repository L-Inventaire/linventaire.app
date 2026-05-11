import { Select } from "@radix-ui/themes";
import { TFunction, useTranslation } from "react-i18next";
import { useInvoiceMaps } from "@features/invoices/hooks/use-invoice-maps";
import { getUnitLabel as getUnitLabelFromMaps } from "@shared/consts";

/** An input to select a unit and functions to convert them */
// This is present in backend, keep in sync
export const supportedUnits = {
  general: ["unit"],
  time: ["min", "h", "d", "w", "mo", "y"],
  length: ["mm", "cm", "m", "km"],
  mass: ["mg", "g", "kg"],
};

export const getUnitLabel = (
  unit: string = "",
  t: TFunction<"translation", undefined>,
) => {
  return t(["atoms.input.unit." + (unit || "EA"), getUnitLabelFromMaps(unit)], {
    defaultValue: unit,
  });
};

export const Unit = (props: { unit?: string }) => {
  const { t } = useTranslation();
  const { maps } = useInvoiceMaps();
  return getUnitLabel(maps?.units?.[props.unit || "EA"] || "unit", t);
};

export const InputUnit = (props: Select.RootProps & { className?: string }) => {
  const { t } = useTranslation();
  const { unitOptions, maps } = useInvoiceMaps();

  return (
    <Select.Root {...props}>
      <Select.Trigger className={props.className}>
        {getUnitLabel(
          maps?.units?.[props.value as string] ||
            props.value ||
            t("atoms.input.unit.unit"),
          t,
        )}
      </Select.Trigger>
      <Select.Content>
        {unitOptions.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {getUnitLabel(option.label, t)}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};
