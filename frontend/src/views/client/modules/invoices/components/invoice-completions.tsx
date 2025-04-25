import { Invoices } from "@features/invoices/types/types";

export const computeStockCompletion = (
  linesu: Invoices["content"],
  type: "delivered" | "ready" = "ready",
  overflow = false,
  service = false
) => {
  const lines = (linesu || []).filter(
    (a) =>
      (service
        ? a.type === "service"
        : a.type === "consumable" || a.type === "product") &&
      !(a.optional && !a.optional_checked)
  );
  const noPriceWeight =
    lines.reduce(
      (acc, line) => acc + parseFloat((line.unit_price || 0) as any),
      0
    ) / lines.length || 1;

  const total = lines.reduce(
    (acc, line) =>
      acc +
      parseFloat((line.quantity as any) || 0) *
        parseFloat((line.unit_price as any) || 0 || noPriceWeight),
    0
  );
  if (total === 0) return 1;

  const column = type === "ready" ? "quantity_ready" : "quantity_delivered";
  const val = lines.reduce(
    (acc, line) =>
      acc +
      (overflow
        ? parseFloat((line[column] as any) || 0) *
          parseFloat((line.unit_price as any) || 0 || noPriceWeight)
        : Math.min(
            parseFloat((line.quantity as any) || 0) *
              parseFloat((line.unit_price as any) || 0 || noPriceWeight),
            parseFloat((line[column] as any) || 0) *
              parseFloat((line.unit_price as any) || 0 || noPriceWeight)
          )),
    0
  );

  return val / total;
};

export const renderStockCompletion = (
  lines: Invoices["content"],
  type: "delivered" | "ready" = "ready",
  overflow = false,
  service = false
): [number, string] => {
  const value = computeStockCompletion(lines, type, overflow, service);
  const color = value < 0.5 ? "red" : value < 1 ? "orange" : "green";
  return [Math.round(value * 100), color];
};

export const computePaymentCompletion = (
  linesu: Invoices["content"],
  type: "delivered" | "ready" = "ready",
  overflow = false
) => {
  const lines = linesu || [];
  const total = lines.reduce(
    (acc, line) => acc + parseFloat((line.quantity as any) || 0),
    0
  );
  if (total === 0) return 1;

  const column = type === "ready" ? "quantity_ready" : "quantity_delivered";

  return (
    lines.reduce(
      (acc, line) =>
        acc +
        (overflow
          ? parseFloat((line[column] as any) || 0)
          : Math.min(
              parseFloat((line.quantity as any) || 0),
              parseFloat((line[column] as any) || 0)
            )),
      0
    ) / total
  );
};

export const renderPaymentCompletion = (
  lines: Invoices["content"],
  type: "delivered" | "ready" = "ready",
  overflow = false
): [number, string] => {
  const value = computeStockCompletion(lines, type, overflow);
  const color = value < 0.5 ? "red" : value < 1 ? "orange" : "green";
  return [Math.round(value * 100), color];
};
