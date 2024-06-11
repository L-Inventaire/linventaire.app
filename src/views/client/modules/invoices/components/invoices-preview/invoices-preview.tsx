import { iconBase64 } from "@assets/icon-b64";
import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { Invoices } from "@features/invoices/types/types";
import { paymentOptions, unitOptions } from "@features/utils/constants";
import { AddressLength, formatAddress } from "@features/utils/format/address";
import { formatTime } from "@features/utils/format/dates";
import {
  formatAmount as formatAmountOriginal,
  formatIBAN,
  formatNumber,
} from "@features/utils/format/strings";
import jsPDF from "jspdf";
import _ from "lodash";
import "./invoices-preview.scss";

import { DateTime } from "luxon";
import { getTvaValue } from "../../utils";
import { useFile, useFiles } from "@features/files/hooks/use-files";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { FilesApiClient } from "@features/files/api-client/files-api-client";

type InvoicesPreviewProps = {
  invoice: Invoices;
};

export function InvoicesPreview({ invoice }: InvoicesPreviewProps) {
  const { client: clientUser } = useClients();

  const user = clientUser?.client;
  const invoiceClient = useContact(invoice?.client ?? "")?.contact;
  const logo = useFile(
    (invoice?.format?.logo[0] || "").split(":").pop() || ""
  ).file;
  const footerLogo = useFile(
    (invoice?.format?.footer_logo[0] || "").split(":").pop() || ""
  ).file;
  const attachments = useFiles({
    query: buildQueryFromMap({
      id: invoice?.attachments?.map((a) => a.split(":").pop()),
    }),
    limit: invoice?.attachments?.length || 0,
  }).files;

  const formatAmount = (amount: number) =>
    formatAmountOriginal(amount).replace(/\s/gm, " "); // JS PDF incompatible with non-breaking space

  return (
    <div className="invoice-preview-root" id="invoice-preview">
      <div style={{ margin: "15px 20px" }}>
        {!!logo && (
          <img
            src={FilesApiClient.getDownloadUrl(logo)}
            style={{
              maxWidth: "30%",
              maxHeight: "40px",
              float: "right",
              marginTop: "8px",
            }}
            alt={user?.company.legal_name}
          />
        )}

        <h1
          className="header"
          style={{ color: invoice?.format?.color || "black" }}
        >
          {invoice?.type === "quotes"
            ? "Devis"
            : invoice?.type === "invoices"
            ? "Facture"
            : "Avoir"}
        </h1>
        <h2 className="subheader light">N° {invoice?.reference}</h2>
        <div className="marginxdiv"></div>
        <table className="table" style={{ width: "100%" }}>
          <tr style={{ textAlign: "left" }}>
            <th className="contrast" style={{ width: "50%" }}>
              {user?.company.legal_name}
            </th>
            <th className="contrast">
              {invoiceClient?.business_name ??
                (invoiceClient?.person_last_name &&
                invoiceClient?.person_first_name
                  ? invoiceClient?.person_last_name +
                    " " +
                    invoiceClient?.person_first_name
                  : "Client")}
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
                {formatAddress(user?.address, AddressLength.part1, "")}
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
                {formatAddress(invoiceClient?.address, AddressLength.part1, "")}
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
                {formatAddress(user?.address, AddressLength.part2, "")}
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
                {formatAddress(invoiceClient?.address, AddressLength.part2, "")}
              </span>
            </td>
          </tr>
          {invoiceClient?.business_tax_id && (
            <tr>
              <td>N° SIRET : {user?.company?.registration_number}</td>
              <td>
                {invoiceClient?.business_tax_id
                  ? "N° SIRET : " + invoiceClient?.business_tax_id
                  : ""}
              </td>
            </tr>
          )}
          {user?.company?.tax_number && (
            <tr>
              <td>N° TVA : {user?.company?.tax_number}</td>
            </tr>
          )}
        </table>
        <div className="marginxdiv"></div>

        <table className="table" style={{ width: "100%" }}>
          <tr>
            <td style={{ whiteSpace: "nowrap" }}>
              <span className="light strong">Date d'émission</span>
            </td>
            <td>
              <span className="strong" style={{ paddingLeft: "16px" }}>
                {formatTime(new Date(invoice.emit_date || null).getTime(), {
                  hideTime: true,
                  keepDate: true,
                  numeric: true,
                })}
              </span>
            </td>
            <td style={{ width: "100%" }}></td>
          </tr>
          {!!invoice?.payment_information?.delay && (
            <tr>
              <td style={{ whiteSpace: "nowrap" }}>
                <span className="light strong">
                  Date d'exigibilité du paiement
                </span>
              </td>
              <td>
                <span className="strong" style={{ paddingLeft: "16px" }}>
                  {formatTime(
                    DateTime.fromMillis(
                      new Date(invoice.emit_date || null).getTime()
                    )
                      .plus({
                        days: invoice.payment_information.delay,
                      })
                      .toMillis(),
                    {
                      hideTime: true,
                      numeric: true,
                      keepDate: true,
                    }
                  )}
                </span>
              </td>
              <td />
            </tr>
          )}
          {false && (
            <tr>
              <td className="light" style={{ fontWeight: "800" }}>
                Date de paiement
              </td>
              <td>05/01/2024</td>
            </tr>
          )}
        </table>

        {!!invoice.format?.heading && (
          <>
            <div className="marginxdiv"></div>
            <table className="table">
              <tr>
                <td>{invoice.format?.heading}</td>
              </tr>
            </table>
          </>
        )}

        <div className="marginxdiv"></div>
        <table
          className="table-prestations"
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "2px",
          }}
        >
          <colgroup>
            <col width="0%" />
            <col width="1%" />
            <col />
            <col width="1%" />
            <col width="1%" />
            <col width="1%" />
            <col width="1%" />
            <col width="1%" />
            <col width="1%" />
          </colgroup>
          <thead>
            <tr>
              <th
                style={{
                  background: invoice?.format?.color || "black",
                  textAlign: "right",
                }}
                colSpan={2}
              >
                #
              </th>
              <th style={{ background: invoice?.format?.color || "black" }}>
                Désignation et description
              </th>
              <th
                style={{
                  background: invoice?.format?.color || "black",
                  textAlign: "left",
                }}
              >
                Unité
              </th>
              <th
                style={{
                  background: invoice?.format?.color || "black",
                  textAlign: "right",
                }}
              >
                Qté
              </th>
              <th
                style={{
                  background: invoice?.format?.color || "black",
                  textAlign: "right",
                }}
              >
                Prix u. HT
              </th>
              <th
                style={{
                  background: invoice?.format?.color || "black",
                  textAlign: "right",
                }}
              >
                TVA
              </th>
              <th
                style={{
                  background: invoice?.format?.color || "black",
                  textAlign: "right",
                }}
              >
                Montant HT
              </th>
              <th
                style={{
                  background: invoice?.format?.color || "black",
                  textAlign: "right",
                }}
              >
                Montant TTC
              </th>
            </tr>
          </thead>
          <tbody>
            {(invoice.content ?? []).map((line, i) => {
              const index = (invoice.content || [])
                .slice(0, i)
                .filter((l) => l.type !== "separation").length;
              const separation = line.type === "separation";

              let unitPrice = line.unit_price ?? 0;
              let linePrice = unitPrice * (line.quantity ?? 0);
              let discount = 0;

              if (line.discount && line.unit_price) {
                discount =
                  line.discount?.mode === "percentage"
                    ? (linePrice * line.discount.value) / 100
                    : line.discount.value;
                linePrice = linePrice - discount;
              }

              return (
                <>
                  <tr>
                    <td
                      style={{
                        textAlign: "center",
                        paddingLeft: "0",
                        paddingRight: "0",
                      }}
                    >
                      {line.optional && (
                        <input
                          type="checkbox"
                          disabled
                          checked={line.optional_checked ?? false}
                          style={{ width: "16px", height: "16px" }}
                        />
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="strong">{!separation && index + 1}</span>
                    </td>
                    <td
                      style={{ textAlign: "left" }}
                      colSpan={separation ? 7 : 1}
                    >
                      <p className="strong">{line.name}</p>
                      <span className="contrast">{line.description}</span>
                    </td>
                    {!separation && (
                      <>
                        <td>
                          {unitOptions.find(
                            (option) => option.value === line.unit
                          )?.label || "Unité"}
                        </td>
                        <td
                          style={{ textAlign: "right", whiteSpace: "nowrap" }}
                        >
                          {formatNumber(line.quantity || 1).replace(/ /gm, " ")}
                        </td>
                        <td
                          style={{ textAlign: "right", whiteSpace: "nowrap" }}
                        >
                          {formatAmount(unitPrice)}
                        </td>
                        <td
                          style={{ textAlign: "right", whiteSpace: "nowrap" }}
                        >
                          {getTvaValue(line.tva || "") > 0
                            ? getTvaValue(line.tva || "") * 100 + "%"
                            : ""}
                        </td>
                        <td
                          style={{ textAlign: "right", whiteSpace: "nowrap" }}
                        >
                          {formatAmount(
                            parseFloat(linePrice as any) +
                              parseFloat(discount as any)
                          )}
                          {line.discount && line.unit_price && (
                            <div className="light">
                              -{formatAmount(discount)}
                            </div>
                          )}
                        </td>
                        <td
                          style={{ textAlign: "right", whiteSpace: "nowrap" }}
                        >
                          {formatAmount(
                            (getTvaValue(line.tva || "0") + 1) * linePrice
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                  <tr>
                    <td
                      colSpan={9}
                      className="separator"
                      style={{ height: 0, padding: 0 }}
                    />
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
        {!!invoice?.attachments?.length && (
          <>
            <div className="marginxdiv"></div>
            <table className="table">
              <tr>
                <td>
                  <span className="contrast strong">Documents joints</span>
                </td>
              </tr>
              <tr>
                <td>
                  {attachments?.data?.list?.map((a) => a.name)?.join(", ")}
                </td>
              </tr>
            </table>
          </>
        )}

        <div className="marginxdiv"></div>

        <div style={{ width: "100%" }}>
          <table className="table" style={{ width: "50%", float: "left" }}>
            <tbody>
              {(invoice?.payment_information?.delay || 0) > 0 && (
                <>
                  <tr>
                    <td className="contrast strong">Délai de paiement</td>
                  </tr>
                  <tr>
                    <td>{invoice?.payment_information?.delay} jours</td>
                  </tr>
                  <tr style={{ height: 8 }}></tr>
                </>
              )}
              {invoice?.payment_information?.late_penalty && (
                <>
                  <tr>
                    <td className="contrast strong">Pénalité de retard</td>
                  </tr>
                  <tr>
                    <td>{invoice?.payment_information?.late_penalty}</td>
                  </tr>
                  <tr style={{ height: 8 }}></tr>
                </>
              )}
              {!!invoice?.payment_information?.recovery_fee && (
                <>
                  {" "}
                  <tr>
                    <td className="contrast strong">
                      Indemnité forfaitaire pour frais de recouvrement
                    </td>
                  </tr>
                  <tr>
                    <td>{invoice?.payment_information?.recovery_fee} €</td>
                  </tr>
                  <tr style={{ height: 8 }}></tr>
                </>
              )}
              {!!invoice?.payment_information?.mode?.length && (
                <>
                  {" "}
                  <tr>
                    <td className="contrast strong">Moyens de paiement</td>
                  </tr>
                  <tr>
                    <td>
                      {(invoice?.payment_information?.mode ?? [])
                        .map(
                          (mode) =>
                            paymentOptions.find(
                              (option) => option.value === mode
                            )?.label
                        )
                        .join(", ")}
                    </td>
                  </tr>
                  {invoice?.payment_information?.mode?.includes(
                    "bank_transfer"
                  ) &&
                    invoice?.payment_information?.bank_iban &&
                    invoice?.type === "invoices" && (
                      <>
                        {" "}
                        <tr style={{ height: 8 }}></tr>
                        <tr>
                          <td>
                            <span className="contrast strong">
                              Informations bancaires:
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <table>
                              <tr>
                                <td>
                                  <span className="light strong">BIC</span>
                                </td>
                                <td style={{ width: 16 }} />
                                <td>
                                  {invoice?.payment_information?.bank_bic?.toLocaleUpperCase()}
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <span className="light strong">IBAN</span>
                                </td>{" "}
                                <td style={{ width: 16 }} />
                                <td>
                                  {formatIBAN(
                                    invoice?.payment_information?.bank_iban
                                  )}{" "}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>{" "}
                      </>
                    )}
                  <tr style={{ height: 8 }}></tr>
                </>
              )}
            </tbody>
          </table>
          <table
            className="table table-total bglight"
            style={{ width: "50%", fontWeight: "bold" }}
          >
            <tbody>
              <tr>
                <td style={{ verticalAlign: "middle" }}>Total HT</td>
                <td style={{ textAlign: "right" }}>
                  {formatAmount(invoice.total?.initial ?? 0)}
                </td>
              </tr>
              {!!parseFloat(invoice.total?.discount as any) && (
                <>
                  <tr>
                    <td style={{ verticalAlign: "middle" }}>Remise</td>
                    <td style={{ textAlign: "right" }}>
                      {formatAmount(invoice.total?.discount ?? 0)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ verticalAlign: "middle" }}>
                      Total HT après remise
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatAmount(invoice.total?.total ?? 0)}
                    </td>
                  </tr>
                </>
              )}
              {!!parseFloat(invoice.total?.taxes as any) && (
                <>
                  <tr>
                    <td>TVA</td>
                    <td style={{ textAlign: "right" }}>
                      {formatAmount(invoice.total?.taxes ?? 0)}
                    </td>
                  </tr>
                  <tr>
                    <td>Total TTC</td>
                    <td style={{ textAlign: "right" }}>
                      {formatAmount(invoice.total?.total_with_taxes ?? 0)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          <div className="marginxdiv"></div>
          <table className="table">
            <tr>
              <td>{invoice.format?.tva}</td>
            </tr>
          </table>
        </div>

        {!!invoice.format?.footer && (
          <>
            <div className="marginxdiv"></div>
            <table className="table">
              <tr>
                <td>{invoice.format?.footer}</td>
              </tr>
            </table>
          </>
        )}

        {!!invoice.format?.payment_terms && (
          <>
            <div className="marginxdiv"></div>
            <div className="separator"></div>
            <div className="marginxdiv"></div>
            <table className="table">
              <tr>
                <td>{invoice.format?.payment_terms}</td>
              </tr>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export const getPdfPreview = () => {
  let element = document.getElementById("invoice-preview");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [842, 595],
  });
  doc.setCharSpace(0);

  doc.html(element ?? "<div>ERROR</div>", {
    callback: function (doc) {
      async function addFooters() {
        const pageCount = doc.getNumberOfPages();
        for (var i = 1; i <= pageCount; i++) {
          doc.addImage(iconBase64, "PNG", 540, 800, 16, 16);
          doc.textWithLink("linventaire.app", 470, 812, {
            url: "https://linventaire.app",
          });

          doc.text("Page " + String(i) + " sur " + pageCount, 40, 812);
        }
      }

      addFooters();
      window.open(doc.output("bloburl"));
    },
    html2canvas: {
      letterRendering: true,
    },
    x: 10,
    y: 10,
    width: element?.offsetWidth || 0,
    margin: 8,
  });
};
