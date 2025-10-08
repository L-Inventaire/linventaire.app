import { Text, View } from "@react-pdf/renderer";
import React from "react";
import Framework from "../../../../../platform";
import { Context } from "../../../../../types";
import Clients from "../../../../clients/entities/clients";
import Invoices from "../../entities/invoices";
import { displayDate, KeyValueDisplay } from "./utils";
import { computePaymentDelayDate } from "../../triggers/on-payment-delay-changed";
import { captureException } from "@sentry/node";

export const InvoiceSelf = ({
  ctx,
  me,
  document,
  colors,
  timezone,
  as,
}: {
  ctx: Context;
  me: Clients;
  document: Invoices;
  colors: { primary: string; secondary: string };
  timezone: string;
  as: "proforma" | "receipt_acknowledgement" | "delivery_slip";
}) => {
  let payBefore = null;
  try {
    payBefore = computePaymentDelayDate(document).toJSDate();
  } catch (e) {
    console.log(e);
    captureException(e);
  }

  return (
    <View style={{ width: "50%", fontSize: 11 }}>
      <Text style={{ fontWeight: "bold" }}>
        {me.company.legal_name || me.company.name}
      </Text>
      <Text>{me.address.address_line_1}</Text>
      <Text>{me.address.address_line_2}</Text>
      <Text>
        {[
          [me.address.zip, me.address.city].filter(Boolean).join(" "),
          me.address.region,
          me.address.country,
        ]
          .filter(Boolean)
          .join(", ")}
      </Text>
      <Text>
        {Framework.I18n.t(ctx, "invoices.identities.registration_number")}
        {me.company.registration_number}
      </Text>
      {!!me.company.tax_number && (
        <Text>
          {Framework.I18n.t(ctx, "invoices.identities.vat_number")}
          {me.company.tax_number}
        </Text>
      )}

      <View style={{ marginTop: 8 }} />

      <KeyValueDisplay
        style={{ fontSize: 9, width: "70%" }}
        secondaryColor={colors.secondary}
        list={[
          {
            label: Framework.I18n.t(ctx, "invoices.other.emit_date"),
            value: displayDate(
              new Date(
                // Bon de livraison: la date d'émission doit être la date d'impression / génération du PDF
                as === "delivery_slip" ? Date.now() : document.emit_date
              ),
              timezone,
              document.language
            ),
          },
          !!payBefore &&
            document.type === "invoices" && {
              label: Framework.I18n.t(ctx, "invoices.other.payment_date"),
              value: displayDate(payBefore, timezone, document.language),
            },
        ]}
      />
    </View>
  );
};
