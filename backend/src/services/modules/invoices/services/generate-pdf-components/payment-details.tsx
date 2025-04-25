import { Text, View } from "@react-pdf/renderer";
import React from "react";
import Invoices from "../../entities/invoices";
import {
  convertHtmlText,
  displayDate,
  formatIBAN,
  KeyValueDisplay,
} from "./utils";
import Framework from "../../../../../platform";
import { Context } from "../../../../../types";
import _ from "lodash";

export const InvoicePaymentDetails = ({
  ctx,
  document,
  colors,
  timezone,
}: {
  ctx: Context;
  document: Invoices;
  colors: { primary: string; secondary: string };
  timezone: string;
}) => {
  const recurringModes = _.uniq(
    document.content
      .filter((a) => a.article)
      .map((a) => a.subscription || "none")
  );

  return (
    <View style={{ width: "50%" }}>
      <KeyValueDisplay
        secondaryColor={colors.secondary}
        style={{ fontSize: 9 }}
        vertical
        list={[
          !!document.content?.some((a) => a.subscription) &&
            document.type === "quotes" && {
              label: Framework.I18n.t(ctx, "invoices.other.recurrence"),
              value:
                Framework.I18n.t(ctx, "invoices.other.recurrence_types", {
                  replacements: {
                    types: recurringModes
                      .map((a) =>
                        Framework.I18n.t(ctx, "invoices.other.frequency." + a)
                      )
                      .join(", "),
                  },
                }) +
                "\n" +
                Framework.I18n.t(
                  ctx,
                  "invoices.other.recurrence_invoices_date." +
                    document.subscription?.invoice_date
                ) +
                "\n" +
                "- " +
                Framework.I18n.t(
                  ctx,
                  "invoices.other.recurrence_start." +
                    document.subscription?.start_type,
                  {
                    replacements: {
                      date: document.subscription?.start
                        ? displayDate(document.subscription?.start, timezone)
                        : "",
                    },
                  }
                ) +
                "\n" +
                "- " +
                Framework.I18n.t(
                  ctx,
                  "invoices.other.recurrence_end." +
                    document.subscription?.end_type,
                  {
                    replacements: {
                      date: document.subscription?.end
                        ? displayDate(document.subscription?.end, timezone)
                        : "",
                      delay: Framework.I18n.t(
                        ctx,
                        "invoices.other.recurrence_end.delays." +
                          document.subscription?.end_delay,
                        {
                          fallback: document.subscription?.end_delay,
                        }
                      ),
                    },
                  }
                ),
            },
          !!document.payment_information.delay && {
            label: Framework.I18n.t(ctx, "invoices.other.delay"),
            value: document.payment_information.delay + " jours",
          },
          !!document.payment_information.recovery_fee && {
            label: Framework.I18n.t(ctx, "invoices.other.recovery_fee"),
            value: document.payment_information.recovery_fee,
          },
          !!document.payment_information.late_penalty && {
            label: Framework.I18n.t(ctx, "invoices.other.late_penalty"),
            value: document.payment_information.late_penalty,
          },
          {
            label: Framework.I18n.t(ctx, "invoices.other.payment_method"),
            value:
              (document.payment_information?.mode ?? []).length > 0
                ? (document.payment_information?.mode ?? [])
                    .map((mode) =>
                      Framework.I18n.t(
                        ctx,
                        `invoices.content.payment_method.${mode}`
                      )
                    )
                    .join(", ")
                : Framework.I18n.t(ctx, "invoices.other.no_payment_method"),
          },
          !!document.payment_information.bank_iban && {
            label: Framework.I18n.t(ctx, "invoices.other.bank_details"),
            value: (
              <>
                <Text>
                  {formatIBAN(document.payment_information.bank_iban)}
                </Text>
                <Text>{document.payment_information.bank_bic}</Text>
              </>
            ),
          },
          !!document.format.payment_terms && {
            label: Framework.I18n.t(ctx, "invoices.other.payment_terms"),
            value: convertHtmlText(document.format.payment_terms),
          },
        ]}
      />
    </View>
  );
};
