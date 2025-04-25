import { Text, View } from "@react-pdf/renderer";
import React from "react";
import Framework from "../../../../../platform";
import { Context } from "../../../../../types";
import Invoices from "../../entities/invoices";
import { computePricesFromInvoice } from "../../utils";
import { convertHtml, formatAmount, KeyValueDisplay } from "./utils";

export const InvoiceTotal = ({
  ctx,
  document,
  colors,
  checkedIndexes,
}: {
  ctx: Context;
  document: Invoices;
  colors: { primary: string; secondary: string; lightGray: string };
  checkedIndexes?: { [key: number]: boolean };
}) => {
  const invoiceTotal = computePricesFromInvoice(document, checkedIndexes);

  return (
    <View
      style={{
        marginLeft: 16,
        flexGrow: 1,
      }}
    >
      {!!document.discount && !!document.discount.value && (
        <View
          style={{
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 8,
          }}
        >
          <Text>{Framework.I18n.t(ctx, "invoices.total.global_discount")}</Text>
          <Text
            style={{
              fontSize: 9,
              padding: 2,
              paddingLeft: 4,
              paddingRight: 4,
              borderRadius: 4,
              backgroundColor: "#FFDDDD",
              marginTop: 4,
            }}
          >
            -{" "}
            {document.discount?.mode === "amount"
              ? formatAmount(document.discount.value, document.currency)
              : document.discount?.value + "%"}
          </Text>
        </View>
      )}

      <KeyValueDisplay
        style={{
          padding: 8,
          paddingBottom: 4,
          backgroundColor: colors.lightGray,
          marginBottom: 16,
          borderRadius: 4,
        }}
        list={[
          {
            label: Framework.I18n.t(ctx, "invoices.total.initial"),
            value: formatAmount(invoiceTotal.initial || 0, document.currency),
          },
          ...(invoiceTotal.discount
            ? [
                {
                  label: Framework.I18n.t(ctx, "invoices.total.discount"),
                  value: formatAmount(
                    invoiceTotal.discount || 0,
                    document.currency
                  ),
                },
                {
                  label: Framework.I18n.t(ctx, "invoices.total.total"),
                  value: formatAmount(
                    invoiceTotal.total || 0,
                    document.currency
                  ),
                },
              ]
            : []),
          {
            label: Framework.I18n.t(ctx, "invoices.total.taxes"),
            value: formatAmount(invoiceTotal.taxes || 0, document.currency),
          },
          {
            label: Framework.I18n.t(ctx, "invoices.total.total_with_taxes"),
            value: formatAmount(
              invoiceTotal.total_with_taxes || 0,
              document.currency
            ),
          },
        ]}
      />
      <View>{convertHtml(document.format.tva, { fontSize: 9 })}</View>

      <View
        id="signature"
        style={{
          width: "100%",
          height: "120px",
          backgroundColor: "#FFFFFF",
          color: "#FFFFFF",
        }}
      >
        <Text>SIGNATURE_HERE</Text>
      </View>
    </View>
  );
};
