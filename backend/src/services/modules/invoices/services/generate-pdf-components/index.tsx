import ReactPDF, {
  Document,
  Font,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import React from "react";
import tinycolor from "tinycolor2";
import Framework from "../../../../../platform";
import Clients, {
  ClientsDefinition,
} from "../../../../../services/clients/entities/clients";
import { Context } from "../../../../../types";
import Contacts, {
  ContactsDefinition,
} from "../../../contacts/entities/contacts";
import { Files } from "../../../files/entities/files";
import AccountingTransactions, {
  AccountingTransactionsDefinition,
} from "../../../accounting/entities/transactions";
import Invoices from "../../entities/invoices";
import { getInvoiceLogo } from "../../utils";
import { InvoiceContent } from "./content";
import { InvoiceCounterparty } from "./counterparty";
import { InvoicePaymentDetails } from "./payment-details";
import { InvoiceSelf } from "./self";
import { InvoiceTotal } from "./total";
import {
  convertHtml,
  displayDate,
  formatAmount,
  KeyValueDisplay,
} from "./utils";
import { getInvoiceWithFormatsOverrides } from "../utils";
import { captureException } from "@sentry/node";

Font.register({
  family: "Arial",
  fonts: [
    {
      src: "assets/fonts/Arial.ttf",
    },
    {
      src: "assets/fonts/ArialBold.ttf",
      fontWeight: "bold",
    },
    {
      src: "assets/fonts/ArialItalic.ttf",
      fontStyle: "italic",
    },
    {
      src: "assets/fonts/ArialBoldItalic.ttf",
      fontStyle: "italic",
      fontWeight: "bold",
    },
  ],
});

const PDFErrorBoundary = (props: any) => {
  try {
    return props.children;
  } catch (e) {
    console.error("⚠️ PDF rendering error", e);
    return (
      <Document>
        <Page>
          <Text>An error occurred while generating this document.</Text>
        </Page>
      </Document>
    );
  }
};

export const getPdf = async (
  ctx: Context,
  document: Invoices,
  checkedIndexes: { [key: number]: boolean } = [],
  attachments: Files[],
  references: { article: string; reference: string; line?: number }[] = [],
  as?: "proforma" | "receipt_acknowledgement" | "delivery_slip"
): Promise<{ name: string; pdf: NodeJS.ReadableStream }> => {
  const base = tinycolor(document.format?.color || "#007bff");
  const primaryColor = base.toHexString();

  const secondary = tinycolor(base).toHsl();
  secondary.s = secondary.s * 0.3;
  secondary.l = Math.min(secondary.l * 1.2, 0.6);
  const secondaryColor = tinycolor(secondary).toHexString();

  const gray = tinycolor(base).toHsl();
  gray.s = gray.s * 0.3;
  gray.l = 0.7;
  const grayColor = tinycolor(gray).toHexString();

  const light = tinycolor(base).toHsl();
  light.l = 0.95;
  light.s = light.s * 0.3;
  const lightGrayColor = tinycolor(light).toHexString();

  const colors = {
    primary: primaryColor,
    secondary: secondaryColor,
    lightGray: lightGrayColor,
    gray: grayColor,
  };

  // Create styles
  const styles = StyleSheet.create({
    page: {
      paddingLeft: 30,
      paddingRight: 30,
      paddingTop: 25,
      paddingBottom: document.format.footer ? 80 : 30,
      fontSize: 9,
      fontFamily: "Arial",
      width: "100%",
    },
    title: {
      color: primaryColor,
      fontSize: 28,
      fontWeight: "bold",
      paddingTop: 10,
    },
    subtitle: {
      fontSize: 16,
      color: secondaryColor,
      fontWeight: "bold",
      paddingTop: 10,
    },
  });

  const db = await Framework.Db.getService();

  const counterParty = await db.selectOne<Contacts>(
    ctx,
    ContactsDefinition.name,
    {
      client_id: ctx.client_id,
      id: document.client || document.supplier,
    }
  );

  const counterPartyContact = await db.selectOne<Contacts>(
    ctx,
    ContactsDefinition.name,
    {
      client_id: ctx.client_id,
      id: document?.contact || "#",
    }
  );

  const me = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
    id: ctx.client_id,
  });

  // Load accounting transactions for invoices, supplier_invoices, credit_notes, supplier_credit_notes
  let accountingTransactions: AccountingTransactions[] = [];
  if (
    [
      "invoices",
      "supplier_invoices",
      "credit_notes",
      "supplier_credit_notes",
    ].includes(document.type)
  ) {
    accountingTransactions = await db.select<AccountingTransactions>(
      ctx,
      AccountingTransactionsDefinition.name,
      {
        client_id: ctx.client_id,
        id: document.transactions?.ids || [],
      }
    );
  }

  document = getInvoiceWithFormatsOverrides(
    document,
    counterPartyContact,
    counterParty,
    me
  );

  const timezone = me.preferences?.timezone || "Europe/Paris";

  for (const i in checkedIndexes) {
    const value = ["1", true].includes(checkedIndexes[i]) ? true : false;

    try {
      if (document.content[parseInt(i)]) {
        document.content[parseInt(i)].optional_checked = value;
      }
    } catch (e) {
      console.error(e);
      captureException(e);
    }
  }

  const logoBuffer = await getInvoiceLogo(ctx, document.format.logo);
  const footerLogoBuffer = await getInvoiceLogo(
    ctx,
    document.format.footer_logo
  );

  try {
    const pdf = await ReactPDF.renderToStream(
      <PDFErrorBoundary>
        <Document
          title={
            Framework.I18n.t(ctx, "invoices.types." + (as || document.type))
              .toLocaleLowerCase()
              .replace(/ /, "-") +
            "-" +
            document.reference
          }
        >
          <Page size="A4" style={styles.page}>
            {logoBuffer && (
              <View style={{ position: "absolute", right: 30, top: 40 }}>
                <Image
                  source={Buffer.from(logoBuffer)}
                  style={{ maxWidth: 150, maxHeight: 150 }}
                />
              </View>
            )}
            {footerLogoBuffer && (
              <View
                fixed
                style={{ position: "absolute", bottom: 15, left: "53%" }}
              >
                <Image
                  source={Buffer.from(footerLogoBuffer)}
                  style={{ maxWidth: 48, maxHeight: 24 }}
                />
              </View>
            )}

            <Text
              style={{
                fontSize: 9,
                position: "absolute",
                bottom: 15,
                right: 30,
              }}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
              fixed
            />
            {!!document.format.branding && (
              <Text
                style={{
                  fontSize: 9,
                  position: "absolute",
                  bottom: 15,
                  left: 30,
                }}
                render={() => (
                  <Text>
                    Copilotez votre entreprise avec{" "}
                    <Link src="https://linventaire.app">linventaire.app</Link>
                  </Text>
                )}
                fixed
              />
            )}
            {!!document.format?.footer && (
              <View
                style={{
                  fontSize: 8,
                  textAlign: "center",
                  position: "absolute",
                  bottom: 35,
                  left: 30,
                  right: 30,
                }}
              >
                {convertHtml(document.format.footer, {
                  fontSize: 8,
                  textAlign: "center",
                })}
              </View>
            )}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.title}>
                {Framework.I18n.t(
                  ctx,
                  "invoices.types." + (as || document.type)
                )}
              </Text>
              <Text style={styles.subtitle}>
                {!!as &&
                  Framework.I18n.t(
                    ctx,
                    "invoices.reference_related." + document.type
                  )}
                {Framework.I18n.t(ctx, "invoices.no_prefix")}
                {document.reference}
              </Text>
            </View>
            {/* Designation section for quotes (not supplier quotes) */}
            {document.type === "quotes" && !!document.name && (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {document.name}
                </Text>
              </View>
            )}

            <View
              style={{ flexDirection: "row", width: "100%", marginBottom: 24 }}
            >
              <InvoiceSelf
                ctx={ctx}
                colors={colors}
                me={me}
                document={document}
                timezone={timezone}
                as={as}
              />
              <InvoiceCounterparty
                ctx={ctx}
                colors={colors}
                counterparty={counterParty}
                counterpartyContact={counterPartyContact}
                document={document}
                timezone={timezone}
              />
            </View>
            {(!!document.name || !!document.alt_reference) && (
              <View
                style={{ flexDirection: "row", width: "50%", marginBottom: 24 }}
              >
                {!!document.name && (
                  <KeyValueDisplay
                    vertical
                    secondaryColor={colors.secondary}
                    style={{ fontSize: 9 }}
                    list={[
                      {
                        label: Framework.I18n.t(ctx, "invoices.other.title"),
                        value: document.name,
                      },
                    ]}
                  />
                )}
                {!!document.alt_reference && (
                  <KeyValueDisplay
                    vertical
                    secondaryColor={colors.secondary}
                    style={{ fontSize: 9 }}
                    list={[
                      {
                        label: Framework.I18n.t(
                          ctx,
                          "invoices.other.alt_reference"
                        ),
                        value: document.alt_reference,
                      },
                    ]}
                  />
                )}
              </View>
            )}
            {document.format?.heading && (
              <Text style={{ fontSize: 9, marginBottom: 20 }}>
                {convertHtml(document.format.heading)}
              </Text>
            )}
            {document.from_subscription?.from &&
              document.from_subscription?.to && (
                <Text style={{ fontSize: 9, marginBottom: 20 }}>
                  {Framework.I18n.t(ctx, "invoices.other.subscription_period", {
                    replacements: {
                      from: displayDate(
                        document.from_subscription.from,
                        timezone,
                        document.language
                      ),
                      to: displayDate(
                        document.from_subscription.to,
                        timezone,
                        document.language
                      ),
                    },
                  })}
                </Text>
              )}
            <InvoiceContent
              ctx={ctx}
              colors={colors}
              document={document}
              references={references}
              as={as}
            />
            {document.content.some((a) => a.optional) && (
              <Text style={{ fontSize: 8, marginBottom: 8 }}>
                {Framework.I18n.t(ctx, "invoices.optional_info")}
              </Text>
            )}
            {!!attachments?.length && (
              <Text style={{ fontSize: 8, marginBottom: 8 }}>
                {Framework.I18n.t(ctx, "invoices.attachments")}{" "}
                {attachments.map((a) => a.name).join(", ")}
              </Text>
            )}
            <View style={{ marginBottom: 16 }} />
            {as !== "delivery_slip" && (
              <View
                style={{
                  flexDirection: "row",
                  width: "100%",
                  marginBottom: 24,
                }}
              >
                <InvoicePaymentDetails
                  ctx={ctx}
                  colors={colors}
                  document={document}
                  timezone={timezone}
                />
                <InvoiceTotal
                  ctx={ctx}
                  colors={colors}
                  document={document}
                  checkedIndexes={checkedIndexes}
                />
              </View>
            )}

            {/* Display accounting transactions payments */}
            {accountingTransactions.length > 0 && (
              <View style={{ marginTop: 16, marginBottom: 16 }}>
                <KeyValueDisplay
                  secondaryColor={colors.secondary}
                  style={{ fontSize: 9 }}
                  vertical
                  list={[
                    {
                      label: Framework.I18n.t(ctx, "invoices.payments.title", {
                        fallback: "Paiements",
                      }),
                      value: accountingTransactions
                        .map(
                          (transaction) =>
                            `Payé le ${displayDate(
                              transaction.transaction_date,
                              timezone,
                              document.language
                            )} montant ${formatAmount(
                              transaction.amount,
                              transaction.currency || document.currency || "EUR"
                            )}`
                        )
                        .join("\n"),
                    },
                  ]}
                />
              </View>
            )}
          </Page>
        </Document>
      </PDFErrorBoundary>
    );
    return {
      name: document.reference + ".pdf",
      pdf,
    };
  } catch (error) {
    console.error("Error generating PDF:", error);
    captureException(error);
    throw new Error("Failed to generate PDF");
  }
};
