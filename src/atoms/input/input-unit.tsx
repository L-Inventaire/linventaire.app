import { Select } from "@radix-ui/themes";
import { TFunction, useTranslation } from "react-i18next";

/** An input to select a unit and functions to convert them */
export const supportedUnits = {
  general: ["unit"],
  time: ["min", "h", "d", "w", "mo", "y"],
  length: ["mm", "cm", "m", "km"],
  mass: ["mg", "g", "kg", "t"],
  volume: ["l", "m³"],
  area: ["cm²", "m²", "ha", "km²"],
};

export const getUnitLabel = (
  unit: string = "",
  t: TFunction<"translation", undefined>
) => {
  return t("atoms.input.unit." + (unit || "unit"), {
    defaultValue: unit,
  });
};

export const Unit = (props: { unit?: string }) => {
  const { t } = useTranslation();
  return getUnitLabel(props.unit || "unit", t);
};

export const InputUnit = (props: Select.RootProps & { className?: string }) => {
  const { t } = useTranslation();

  return (
    <Select.Root {...props}>
      <Select.Trigger className={props.className}>
        {t("atoms.input.unit." + (props.value || "unit"), {
          defaultValue: props.value,
        })}
      </Select.Trigger>
      <Select.Content>
        {Object.entries(supportedUnits).map(([group, units]) => (
          <Select.Group key={group}>
            <Select.Label>
              {t("atoms.input.unit.categories." + group)}
            </Select.Label>
            {units.map((unit) => (
              <Select.Item key={unit} value={unit}>
                {t("atoms.input.unit." + unit)}
              </Select.Item>
            ))}
          </Select.Group>
        ))}
      </Select.Content>
    </Select.Root>
  );
};

export const isConvertable = (from: string, to: string) => {
  if (from === to) return true;
  if (from === "unit" || to === "unit") return true;
  return Object.values(supportedUnits).some(
    (units) => units.includes(from) && units.includes(to)
  );
};

export const convertUnit = (value: number, from: string, to: string) => {
  if (from === to) return value;
  if (from === "unit" || to === "unit") return value;

  // Time related
  const factors: any = {
    min: 1,
    h: 60,
    d: 24 * 60,
    w: 24 * 7 * 60,
    mo: 24 * 30 * 60,
    y: 24 * 365 * 60,
  };
  if (supportedUnits.time.includes(from) && supportedUnits.time.includes(to)) {
    return (value * (factors[from] || 0)) / (factors[to] || 1);
  }

  // Length related
  const lengthFactors: any = {
    mm: 1,
    cm: 10,
    m: 1000,
    km: 1000000,
  };
  if (
    supportedUnits.length.includes(from) &&
    supportedUnits.length.includes(to)
  ) {
    return (value * (lengthFactors[from] || 0)) / (lengthFactors[to] || 1);
  }

  // Mass related
  const massFactors: any = {
    mg: 1,
    g: 1000,
    kg: 1000000,
    t: 1000000000,
  };
  if (supportedUnits.mass.includes(from) && supportedUnits.mass.includes(to)) {
    return (value * (massFactors[from] || 0)) / (massFactors[to] || 1);
  }

  // Volume related
  const volumeFactors: any = {
    l: 1,
    "m³": 1000,
  };
  if (
    supportedUnits.volume.includes(from) &&
    supportedUnits.volume.includes(to)
  ) {
    return (value * (volumeFactors[from] || 0)) / (volumeFactors[to] || 1);
  }

  // Area related
  const areaFactors: any = {
    "cm²": 1,
    "m²": 10000,
    ha: 1000000,
    "km²": 100000000,
  };
  if (supportedUnits.area.includes(from) && supportedUnits.area.includes(to)) {
    return (value * (areaFactors[from] || 0)) / (areaFactors[to] || 1);
  }

  return value;
};
