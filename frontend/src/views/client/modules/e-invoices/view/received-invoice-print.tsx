import { ReceivedEInvoices } from "@/features/e-invoicing/types/types";
import { formatAmount, formatNumber } from "@/features/utils/format/strings";
import { EN16931PostalAddress } from "@shared/en16931-types";
import { format } from "date-fns";
import _ from "lodash";
import { renderToStaticMarkup } from "react-dom/server";

const typeLabels: Record<number, string> = {
  380: "Facture",
  381: "Avoir",
  384: "Facture rectificative",
  386: "Facture d'acompte",
  389: "Autofacture",
};

const styles = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; margin: 0; }
  h1 { font-size: 22px; margin: 0 0 4px 0; }
  h2 { font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase; color: #555; }
  p { margin: 0 0 2px 0; }
  .muted { color: #666; }
  .small { font-size: 9px; }
  .row { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
  .party { width: 48%; border: 1px solid #ddd; border-radius: 4px; padding: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; color: #555; border-bottom: 1px solid #999; padding: 6px 4px; }
  td { border-bottom: 1px solid #eee; padding: 6px 4px; vertical-align: top; }
  .right { text-align: right; white-space: nowrap; }
  .totals { width: 45%; margin-left: auto; }
  .totals td { border: none; padding: 3px 4px; }
  .totals .grand td { border-top: 1px solid #999; font-weight: bold; font-size: 13px; padding-top: 6px; }
  .section { margin-bottom: 16px; }
  .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 6px; }
  @page { margin: 15mm; }
`;

const amount = (value?: string | number) => parseFloat(`${value || 0}`) || 0;

const formatDate = (date?: string | number) =>
  date ? format(new Date(date), "dd/MM/yyyy") : "";

const Address = ({ address }: { address?: EN16931PostalAddress }) =>
  address ? (
    <>
      {address.address_line1 && <p>{address.address_line1}</p>}
      {address.address_line2 && <p>{address.address_line2}</p>}
      <p>
        {address.post_code} {address.city}
      </p>
      {address.country_code && <p>{address.country_code}</p>}
    </>
  ) : null;

const ReceivedEInvoicePrintable = ({
  invoice,
  unitLabel,
}: {
  invoice: ReceivedEInvoices;
  unitLabel: (code: string) => string;
}) => {
  const en = invoice.en_invoice;
  const currency = invoice.currency_code || en.currency_code;
  const money = (value?: string | number) =>
    formatAmount(amount(value), currency);
  const vatLabel = (rate?: string, category?: string) =>
    rate ? `${formatNumber(rate)} %` : category || "";

  const allowances = en.document_level_allowances || [];
  const charges = en.charges || [];
  const linesTotal = _.sumBy(en.lines, (line) => amount(line.net_amount));

  return (
    <div>
      <div className="row">
        <div>
          <h1>
            {typeLabels[en.type_code] || "Facture"} {en.number}
          </h1>
          <p>Date d'émission : {formatDate(en.issue_date)}</p>
          {en.payment_due_date && (
            <p>Date d'échéance : {formatDate(en.payment_due_date)}</p>
          )}
          {en.buyer_reference && (
            <p>Référence acheteur : {en.buyer_reference}</p>
          )}
          {en.purchase_order_reference && (
            <p>Commande : {en.purchase_order_reference}</p>
          )}
          {en.contract_reference && <p>Contrat : {en.contract_reference}</p>}
          {!!en.preceding_invoice_references?.length && (
            <p>
              Facture d'origine :{" "}
              {en.preceding_invoice_references
                .map((r) => r.reference)
                .join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="row">
        {[
          { title: "Fournisseur", party: en.seller },
          { title: "Client", party: en.buyer },
        ].map(({ title, party }) => (
          <div className="party" key={title}>
            <h2>{title}</h2>
            <p>
              <b>{party?.name}</b>
            </p>
            <Address address={party?.postal_address} />
            {party?.legal_registration_identifier?.value && (
              <p className="muted">
                SIREN : {party.legal_registration_identifier.value}
              </p>
            )}
            {party?.vat_identifier && (
              <p className="muted">TVA : {party.vat_identifier}</p>
            )}
          </div>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Désignation</th>
            <th className="right">Quantité</th>
            <th className="right">Prix unitaire HT</th>
            <th className="right">TVA</th>
            <th className="right">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {en.lines.map((line, index) => (
            <tr key={index}>
              <td>
                <p>{line.item_information.name}</p>
                {line.item_information.description && (
                  <p className="muted small">
                    {line.item_information.description}
                  </p>
                )}
                {line.item_information.seller_identifier &&
                  line.item_information.seller_identifier !==
                    line.item_information.name && (
                    <p className="muted small">
                      Réf. {line.item_information.seller_identifier}
                    </p>
                  )}
                {(line.allowances || []).map((a, i) => (
                  <p className="muted small" key={"a" + i}>
                    Remise {a.reason || a.reason_code || ""} : -
                    {money(a.amount)}
                  </p>
                ))}
                {(line.charges || []).map((c, i) => (
                  <p className="muted small" key={"c" + i}>
                    Frais {c.reason || c.reason_code || ""} : +{money(c.amount)}
                  </p>
                ))}
              </td>
              <td className="right">
                {formatNumber(line.invoiced_quantity)}{" "}
                {unitLabel(line.invoiced_quantity_code)}
              </td>
              <td className="right">
                {money(
                  // The net price is given for a base quantity (BT-149)
                  amount(line.price_details.item_net_price) /
                    (amount(line.price_details.item_price_base_quantity) || 1),
                )}
              </td>
              <td className="right">
                {vatLabel(
                  line.vat_information.invoiced_item_vat_rate,
                  line.vat_information.invoiced_item_vat_category_code,
                )}
              </td>
              <td className="right">{money(line.net_amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="totals">
        <tbody>
          {(allowances.length > 0 || charges.length > 0) && (
            <tr>
              <td>Total des lignes HT</td>
              <td className="right">{money(linesTotal)}</td>
            </tr>
          )}
          {allowances.map((a, i) => (
            <tr key={"a" + i}>
              <td>
                Remise {a.reason || a.reason_code || ""} (TVA{" "}
                {vatLabel(a.vat_rate, a.vat_category_code)})
              </td>
              <td className="right">-{money(a.amount)}</td>
            </tr>
          ))}
          {charges.map((c, i) => (
            <tr key={"c" + i}>
              <td>
                {c.reason || c.reason_code || "Frais"} (TVA{" "}
                {vatLabel(c.vat_rate, c.vat_category_code)})
              </td>
              <td className="right">+{money(c.amount)}</td>
            </tr>
          ))}
          <tr>
            <td>Total HT</td>
            <td className="right">{money(invoice.total_amount)}</td>
          </tr>
          {(en.vat_break_down || []).map((vat, i) => (
            <tr key={"v" + i}>
              <td>
                TVA {vatLabel(vat.vat_category_rate, vat.vat_category_code)}{" "}
                <span className="muted small">
                  sur {money(vat.vat_category_taxable_amount)}
                </span>
              </td>
              <td className="right">{money(vat.vat_category_tax_amount)}</td>
            </tr>
          ))}
          {(en.vat_break_down || []).length !== 1 && (
            <tr>
              <td>Total TVA</td>
              <td className="right">{money(invoice.total_tax_amount)}</td>
            </tr>
          )}
          <tr className="grand">
            <td>Total TTC</td>
            <td className="right">{money(invoice.total_amount_with_tax)}</td>
          </tr>
          {en.totals?.paid_amount && amount(en.totals.paid_amount) > 0 && (
            <tr>
              <td>Déjà payé</td>
              <td className="right">-{money(en.totals.paid_amount)}</td>
            </tr>
          )}
          {en.totals?.amount_due_for_payment &&
            amount(en.totals.amount_due_for_payment) !==
              amount(invoice.total_amount_with_tax) && (
              <tr className="grand">
                <td>Net à payer</td>
                <td className="right">
                  {money(en.totals.amount_due_for_payment)}
                </td>
              </tr>
            )}
        </tbody>
      </table>

      {(en.payment_terms ||
        !!en.payment_instructions?.credit_transfers?.length) && (
        <div className="section">
          <h2>Paiement</h2>
          {en.payment_terms && <p>{en.payment_terms}</p>}
          {en.payment_instructions?.credit_transfers?.map((transfer, i) => (
            <p key={i}>
              IBAN : {transfer.payment_account_identifier.value}
              {transfer.payment_service_provider_identifier &&
                ` — BIC : ${transfer.payment_service_provider_identifier}`}
            </p>
          ))}
        </div>
      )}

      {!!en.notes?.length && (
        <div className="section">
          <h2>Notes</h2>
          {en.notes.map((note, i) => (
            <p key={i}>{note.note}</p>
          ))}
        </div>
      )}

      <p className="footer muted small">
        Représentation lisible de la facture électronique reçue de{" "}
        {en.seller?.name}, générée par L'inventaire. La facture électronique
        transmise par la plateforme fait foi.
      </p>
    </div>
  );
};

/** Print a readable version of a received e-invoice (or save it as PDF) */
export const printReceivedEInvoice = (
  invoice: ReceivedEInvoices,
  unitLabel: (code: string) => string,
) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${_.escape(
      `${invoice.invoice_number} - ${invoice.seller_name}`,
    )}</title><style>${styles}</style></head><body>${renderToStaticMarkup(
      <ReceivedEInvoicePrintable invoice={invoice} unitLabel={unitLabel} />,
    )}</body></html>`,
  );
  doc.close();

  win.onafterprint = () => setTimeout(() => iframe.remove(), 0);
  win.focus();
  win.print();
};
