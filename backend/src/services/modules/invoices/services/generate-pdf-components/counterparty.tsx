import { Text, View } from "@react-pdf/renderer";
import React from "react";
import Framework from "../../../../../platform";
import { Context } from "../../../../../types";
import Contacts from "../../../../modules/contacts/entities/contacts";
import Invoices from "../../entities/invoices";
import { displayDate, KeyValueDisplay } from "./utils";
import { getContactName } from "#src/services/utils";

export const InvoiceCounterparty = ({
  ctx,
  counterparty,
  counterpartyContact,
  document,
  colors,
  timezone,
}: {
  ctx: Context;
  counterparty: Contacts;
  counterpartyContact?: Contacts;
  document: Invoices;
  colors: { primary: string; secondary: string };
  timezone: string;
}) => {
  if (!counterparty) {
    return <></>;
  }

  /*
  Pour chaque facture et avoirs:
  _ utiliser l'adresse de facturation (en priorité celle du contact, puis celle du client sinon, enfin celle par défaut du client si rien ne match)
  */

  let billingParty = counterparty;
  let billingAddress = counterparty?.address;
  if (document.type === "invoices" || document.type === "credit_notes") {
    if (counterpartyContact?.other_addresses?.billing) {
      billingAddress = counterpartyContact.other_addresses.billing;
      billingParty = counterpartyContact;
    } else if (counterparty?.other_addresses?.billing) {
      billingAddress = counterparty.other_addresses.billing;
    }
  }

  return (
    <View style={{ marginLeft: 16, flexGrow: 1, fontSize: 11, maxWidth: 200 }}>
      <Text style={{ fontWeight: "bold" }} wrap={true}>
        {getContactName(billingParty)}
        {counterpartyContact &&
          counterpartyContact !== billingParty &&
          `, ${getContactName(counterpartyContact)}`}
      </Text>
      {!!billingAddress && (
        <>
          <Text wrap={true}>{billingAddress.address_line_1}</Text>
          <Text wrap={true}>{billingAddress.address_line_2}</Text>
          <Text wrap={true}>
            {[
              [billingAddress.zip, billingAddress.city]
                .filter(Boolean)
                .join(" "),
              billingAddress.region,
              billingAddress.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </Text>
        </>
      )}
      {billingParty.type === "company" &&
        !!billingParty.business_registered_id && (
          <Text wrap={true}>
            {" "}
            {Framework.I18n.t(ctx, "invoices.identities.registration_number")}
            {billingParty.business_registered_id}
          </Text>
        )}
      {billingParty.type === "company" && !!billingParty.business_tax_id && (
        <Text wrap={true}>
          {" "}
          {Framework.I18n.t(ctx, "invoices.identities.vat_number")}
          {billingParty.business_tax_id}
        </Text>
      )}
      {!!(
        document.delivery_date ||
        document.delivery_delay ||
        document.delivery_address?.address_line_1
      ) &&
        document.type === "quotes" && (
          <KeyValueDisplay
            vertical
            secondaryColor={colors.secondary}
            style={{ marginTop: 16, fontSize: 9 }}
            list={[
              !!document.delivery_date && {
                label: Framework.I18n.t(ctx, "invoices.other.delivery_date"),
                value: displayDate(
                  document.delivery_date,
                  timezone,
                  document.language
                ),
              },
              !!document.delivery_delay &&
                document.delivery_delay > 0 && {
                  label: Framework.I18n.t(ctx, "invoices.other.delivery_delay"),
                  value:
                    document.delivery_delay.toString() +
                    " " +
                    Framework.I18n.t(ctx, "invoices.other.days"),
                },
              !!document.delivery_address?.address_line_1 && {
                label: Framework.I18n.t(ctx, "invoices.other.delivery_address"),
                value: (
                  <View>
                    {[
                      document.delivery_address?.address_line_1,
                      document.delivery_address?.address_line_2,
                      [
                        [
                          document.delivery_address?.zip,
                          document.delivery_address?.city,
                        ]
                          .filter(Boolean)
                          .join(" "),
                        document.delivery_address?.region,
                        document.delivery_address?.country,
                      ]
                        .filter(Boolean)
                        .join(", "),
                    ]
                      .filter(Boolean)
                      .map((a) => (
                        <Text>{a}</Text>
                      ))}
                  </View>
                ),
              },
            ]}
          />
        )}
    </View>
  );
};
