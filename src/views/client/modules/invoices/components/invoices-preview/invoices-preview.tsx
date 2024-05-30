import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { Invoices } from "@features/invoices/types/types";
import { paymentOptions, unitOptions } from "@features/utils/constants";
import { AddressLength, formatAddress } from "@features/utils/format/address";
import { formatTime } from "@features/utils/format/dates";
import { formatAmount as realFormatAmount } from "@features/utils/format/strings";
import _ from "lodash";

import { DateTime } from "luxon";

type InvoicesPreviewProps = {
  invoice: Invoices;
};

export function InvoicesPreview({ invoice }: InvoicesPreviewProps) {
  const { client: clientUser } = useClients();

  const user = clientUser?.client;
  const invoiceClient = useContact(invoice?.client ?? "")?.contact;

  const formatAmount = (amount: number) => {
    const formatted = realFormatAmount(amount);
    // Remove unbreakable spaces
    return formatted.replace(/\s/g, " ");
  };

  return (
    <>
      <style>
        {`
                            :root {
                                    font-family: Arial, Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                                    letter-spacing: 0;
                            }

                            .header {
                                    font-size: 1.5rem; /* 24px */
                                    line-height: 2rem; /* 32px */
                                    color: black;
                                    margin: 0px;
                            }

                            .subheader {
                                    font-size: 1rem; /* 16px */
                                    line-height: 1.5rem; /* 24px */
                                    color: rgb(120, 120, 120);
                                    margin: 0px;
                            }

                            .margindiv {
                                    float: left; 
                                    width: 8px;
                                    height: 20px;
                            }
                            .margindiv_small {
                                    float: left; 
                                    width: 8px;
                                    height: 5px;
                            }
                            .margindiv_right_small {
                                    float: right; 
                                    width: 8px;
                                    height: 5px;
                            }
                            .marginxdiv {
                                    width: 1px;
                                    height: 16px;
                            }

                            .marginxdiv_small {
                                width: 1px;
                                height: 8px;
                            }

                            .table caption, .table tbody, .table tfoot, .table thead, .table tr, .table th, .table td {
                                    font-family: Arial, Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                                    letter-spacing: 0;
                                    margin: 0;
                                    padding: 0;
                                    border: 0;
                                    outline: 0;

                                    font-size: 0.65rem;
                                    line-height: 0.85rem;
                            }
                            .tablecolor caption, .tablecolor tbody, .tablecolor tfoot, .tablecolor thead, .tablecolor tr, .tablecolor th, .tablecolor td {
                                    font-family: Arial, Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                                    letter-spacing: 0;
                                    margin: 0;
                                    padding: 0;
                                    outline: 0;

                                    font-size: 0.65rem;
                                    line-height: 0.85rem;
                            }
                            .tablecolor thead tr {
                                    height: 30px;
                                    color: white;
                            }
                            .tablecolor th {
                                    background-color: black;
                            }
                            .separator {
                                    height: 8px;
                                    width: 510px;
                                    border-bottom: 1px solid rgb(216, 216, 216);
                            }
                            .contrast {
                                    color: rgb(55, 58, 60);
                            }
                            .whitened {
                                    color: rgb(132, 150, 163);
                            }
                            .bgwhitened {
                                    background: rgb(236, 240, 243);
                            }
                            `}
      </style>

      <div id="invoice-preview" style={{ margin: "20px 30px" }}>
        <h1 className="header">Facture</h1>
        <h2 className="subheader whitened">N° F-2024-0086 TEST</h2>
        <div className="marginxdiv"></div>
        <table className="table" style={{ width: "500px" }}>
          <tr style={{ textAlign: "left" }}>
            <th className="contrast">{user?.company.legal_name}</th>
            <th className="contrast">
              {invoiceClient?.business_name ??
              (invoiceClient?.person_last_name &&
                invoiceClient?.person_first_name)
                ? invoiceClient?.person_last_name +
                  " " +
                  invoiceClient?.person_first_name
                : "# Préciser le client #"}
            </th>
          </tr>
          <tr>
            <td>
              <span
                style={{
                  color: _.isEmpty(user?.address?.address_line_1)
                    ? "red"
                    : undefined,
                }}
              >
                {formatAddress(
                  user?.address,
                  AddressLength.part1,
                  "# Précisez l'adresse de l'entreprise #"
                )}
              </span>
            </td>
            <td>
              <span
                style={{
                  color: _.isEmpty(invoiceClient?.address?.address_line_1)
                    ? "red"
                    : undefined,
                }}
              >
                {formatAddress(
                  invoiceClient?.address,
                  AddressLength.part1,
                  "# Précisez l'adresse du client #"
                )}
              </span>
            </td>
          </tr>
          <tr>
            <td>
              <span
                style={{
                  color: _.isEmpty(user?.address?.city) ? "red" : undefined,
                }}
              >
                {formatAddress(
                  user?.address,
                  AddressLength.part2,
                  "# Précisez l'adresse de l'entreprise #"
                )}
              </span>
            </td>
            <td>
              <span
                style={{
                  color: _.isEmpty(invoiceClient?.address?.city)
                    ? "red"
                    : undefined,
                }}
              >
                {formatAddress(
                  invoiceClient?.address,
                  AddressLength.part2,
                  "# Précisez l'adresse du client #"
                )}
              </span>
            </td>
          </tr>
          <tr>
            <td>N° SIRET : {user?.company?.registration_number}</td>
            <td>
              {invoiceClient?.business_tax_id
                ? "N° SIRET : " + invoiceClient?.business_tax_id
                : ""}
            </td>
          </tr>
          <tr>
            <td>N° TVA : {user?.company?.tax_number}</td>
          </tr>
        </table>
        <div className="marginxdiv"></div>

        <table className="table" style={{ width: "350px" }}>
          <tr>
            <td className="whitened" style={{ fontWeight: "800" }}>
              Date d'émission
            </td>
            <td>
              {(invoice.emit_date &&
                formatTime(new Date(invoice.emit_date).getTime(), {
                  hideTime: true,
                  keepDate: true,
                  numeric: true,
                })) ??
                "#"}
            </td>
          </tr>
          <tr>
            <td className="whitened" style={{ fontWeight: "800" }}>
              Date d'exigibilité du paiement
            </td>
            <td>
              {(invoice.emit_date &&
                invoice?.payment_information?.delay &&
                formatTime(
                  DateTime.fromMillis(new Date(invoice.emit_date).getTime())
                    .plus({
                      days: invoice.payment_information.delay,
                    })
                    .toMillis(),
                  {
                    hideTime: true,
                    numeric: true,
                    keepDate: true,
                  }
                )) ??
                "#"}
            </td>
          </tr>
          {false && (
            <tr>
              <td className="whitened" style={{ fontWeight: "800" }}>
                Date de paiement
              </td>
              <td>05/01/2024</td>
            </tr>
          )}
        </table>

        <div className="marginxdiv"></div>
        <table
          className="tablecolor"
          style={{
            width: "510px",
            borderCollapse: "separate",
            borderSpacing: "2px",
          }}
        >
          <colgroup>
            <col width="5%" />
            <col width="30%" />
            <col width="10%" />
            <col width="10%" />
            <col width="10%" />
            <col width="10%" />
            <col width="10%" />
            <col width="10%" />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th style={{ whiteSpace: "nowrap", textAlign: "center" }}>
                Désignation et description
              </th>
              <th>Unité</th>
              <th>Quantité</th>
              <th style={{ whiteSpace: "nowrap" }}>Prix u. HT</th>
              <th>TVA</th>
              <th style={{ whiteSpace: "nowrap" }}>Montant HT</th>
              <th style={{ whiteSpace: "nowrap" }}>Montant TTC</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.content ?? []).map((line, index) => {
              const separation = line.type === "separation";

              let unitPrice = line.unit_price ?? 0;

              if (line.discount && line.unit_price) {
                unitPrice =
                  line.discount?.mode === "percentage"
                    ? (line.unit_price * (100 - line.discount.value)) / 100
                    : line.unit_price - line.discount.value;
              }
              let linePrice = unitPrice * (line.quantity ?? 0);

              const linePriceWithTaxes =
                linePrice * (1 + parseInt(line.tva ?? "") / 100) ?? 0;

              return (
                <tr style={{ textAlign: "center" }}>
                  <td>
                    {line.optional && (
                      <input
                        type="checkbox"
                        disabled
                        checked={line.optional_checked ?? false}
                      />
                    )}{" "}
                    {!separation && index + 1}
                  </td>
                  <td style={{ textAlign: "left" }}>
                    <div className="margindiv"></div>
                    <p>{line.name}</p>
                    <span className="whitened">{line.description}</span>
                  </td>
                  <td>
                    {
                      unitOptions.find((option) => option.value === line.unit)
                        ?.label
                    }
                  </td>
                  <td>{line.quantity}</td>
                  <td>{!separation && formatAmount(unitPrice)}</td>
                  <td>{!separation && line.tva + " %"}</td>
                  <td>{!separation && formatAmount(linePrice)}</td>
                  <td>{!separation && formatAmount(linePriceWithTaxes)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="separator"></div>
        <div className="marginxdiv"></div>

        <div style={{ width: "510px" }}>
          <table className="table" style={{ width: "50%", float: "left" }}>
            <tbody>
              <tr>
                <td className="contrast" style={{ fontWeight: "800" }}>
                  Délai de paiement
                </td>
              </tr>
              <tr>
                <td>{invoice?.payment_information?.delay ?? "#"} jours</td>
              </tr>
              <tr>
                <td className="contrast" style={{ fontWeight: "800" }}>
                  Pénalité de retard
                </td>
              </tr>
              <tr>
                <td>
                  {invoice?.payment_information?.late_penalty ?? "#"} fois le
                  taux légal
                </td>
              </tr>
              <tr>
                <td className="contrast" style={{ fontWeight: "800" }}>
                  Indemnité forfaitaire pour frais de recouvrement
                </td>
              </tr>
              <tr>
                <td>{invoice?.payment_information?.recovery_fee ?? "#"} €</td>
              </tr>
              <tr>
                <td className="contrast" style={{ fontWeight: "800" }}>
                  Escompte
                </td>
              </tr>
              <tr>
                <td>Aucun</td>
              </tr>
              <tr>
                <td className="contrast" style={{ fontWeight: "800" }}>
                  Moyens de paiement
                </td>
              </tr>
              <tr>
                <td>
                  {(invoice?.payment_information?.mode ?? []).length === 0 && (
                    <span>Aucun</span>
                  )}
                  {(invoice?.payment_information?.mode ?? [])
                    .map(
                      (mode) =>
                        paymentOptions.find((option) => option.value === mode)
                          ?.label
                    )
                    .join(", ") ?? "#"}
                </td>
              </tr>
            </tbody>
          </table>

          <table
            className="table bgwhitened"
            style={{ float: "left", width: "50%", fontWeight: "800" }}
          >
            <tbody>
              <tr>
                <td style={{ verticalAlign: "middle" }}>
                  <div className="margindiv_small"></div>
                  Total HT<div className="marginxdiv_small"></div>
                  <div className="marginxdiv_small"></div>
                </td>
                <td style={{ textAlign: "end" }}>
                  {formatAmount(invoice.total?.total ?? 0)}
                  <div className="margindiv_right_small"></div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="margindiv_small"></div>TVA
                </td>
                <td style={{ textAlign: "end" }}>
                  {formatAmount(invoice.total?.taxes ?? 0)}
                  <div className="margindiv_right_small"></div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="margindiv_small"></div>Dont 20 %
                </td>
                <td style={{ textAlign: "end" }}>
                  {formatAmount(invoice.total?.taxes ?? 0)}
                  <div className="margindiv_right_small"></div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="margindiv_small"></div>Total TTC
                  <div className="marginxdiv"></div>
                </td>
                <td style={{ textAlign: "end" }}>
                  {formatAmount(invoice.total?.total_with_taxes ?? 0)}
                  <div className="margindiv_right_small"></div>
                  <div className="marginxdiv"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
