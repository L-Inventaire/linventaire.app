import { ReceivedEInvoices } from "@/features/e-invoicing/types/types";
import { formatNumber } from "@/features/utils/format/strings";
import { Badge } from "@radix-ui/themes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const ReceivedEInvoiceDetails = ({
  invoice,
}: {
  invoice: ReceivedEInvoices;
}) => {
  const enInvoice = invoice.en_invoice;

  if (!enInvoice) {
    return <div>Aucune donnée disponible</div>;
  }

  const formatDate = (dateStr: string | number) => {
    const date =
      typeof dateStr === "number" ? new Date(dateStr) : new Date(dateStr);
    return format(date, "dd MMMM yyyy", { locale: fr });
  };

  const getTypeLabel = (typeCode: number) => {
    switch (typeCode) {
      case 380:
        return "Facture";
      case 381:
        return "Avoir";
      case 384:
        return "Facture de correction";
      default:
        return `Type ${typeCode}`;
    }
  };

  const getStateLabel = (state: ReceivedEInvoices["state"]) => {
    switch (state) {
      case "new":
        return { label: "Nouveau", color: "blue" as const };
      case "attached":
        return { label: "Rattaché", color: "green" as const };
      case "rejected":
        return { label: "Rejeté", color: "red" as const };
    }
  };

  const stateInfo = getStateLabel(invoice.state);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {enInvoice.number}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {getTypeLabel(invoice.type_code)}
            </p>
          </div>
          <Badge color={stateInfo.color}>{stateInfo.label}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">
              Date d'émission:
            </span>
            <p className="font-medium">{formatDate(enInvoice.issue_date)}</p>
          </div>
          {enInvoice.payment_due_date && (
            <div>
              <span className="text-slate-600 dark:text-slate-400">
                Date d'échéance:
              </span>
              <p className="font-medium">
                {formatDate(enInvoice.payment_due_date)}
              </p>
            </div>
          )}
          <div>
            <span className="text-slate-600 dark:text-slate-400">Devise:</span>
            <p className="font-medium">{invoice.currency_code}</p>
          </div>
          {enInvoice.buyer_reference && (
            <div>
              <span className="text-slate-600 dark:text-slate-400">
                Référence acheteur:
              </span>
              <p className="font-medium">{enInvoice.buyer_reference}</p>
            </div>
          )}
        </div>
      </div>

      {/* Parties Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seller */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">
            Fournisseur
          </h3>
          <div className="space-y-2 text-sm">
            <p className="font-medium">{enInvoice.seller.name}</p>
            {enInvoice.seller.vat && (
              <p className="text-slate-600 dark:text-slate-400">
                TVA: {enInvoice.seller.vat}
              </p>
            )}
            {enInvoice.seller.postal_address && (
              <div className="text-slate-600 dark:text-slate-400">
                {enInvoice.seller.postal_address.street_name && (
                  <p>{enInvoice.seller.postal_address.street_name}</p>
                )}
                {enInvoice.seller.postal_address.additional_street_name && (
                  <p>
                    {enInvoice.seller.postal_address.additional_street_name}
                  </p>
                )}
                <p>
                  {enInvoice.seller.postal_address.postal_zone}{" "}
                  {enInvoice.seller.postal_address.city_name}
                </p>
                {enInvoice.seller.postal_address.country && (
                  <p>{enInvoice.seller.postal_address.country}</p>
                )}
              </div>
            )}
            {enInvoice.seller.contact?.email && (
              <p className="text-slate-600 dark:text-slate-400">
                {enInvoice.seller.contact.email}
              </p>
            )}
          </div>
        </div>

        {/* Buyer */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">
            Acheteur
          </h3>
          <div className="space-y-2 text-sm">
            <p className="font-medium">{enInvoice.buyer.name}</p>
            {enInvoice.buyer.vat && (
              <p className="text-slate-600 dark:text-slate-400">
                TVA: {enInvoice.buyer.vat}
              </p>
            )}
            {enInvoice.buyer.postal_address && (
              <div className="text-slate-600 dark:text-slate-400">
                {enInvoice.buyer.postal_address.street_name && (
                  <p>{enInvoice.buyer.postal_address.street_name}</p>
                )}
                {enInvoice.buyer.postal_address.additional_street_name && (
                  <p>{enInvoice.buyer.postal_address.additional_street_name}</p>
                )}
                <p>
                  {enInvoice.buyer.postal_address.postal_zone}{" "}
                  {enInvoice.buyer.postal_address.city_name}
                </p>
                {enInvoice.buyer.postal_address.country && (
                  <p>{enInvoice.buyer.postal_address.country}</p>
                )}
              </div>
            )}
            {enInvoice.buyer.contact?.email && (
              <p className="text-slate-600 dark:text-slate-400">
                {enInvoice.buyer.contact.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Lines */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Lignes de facturation
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-right">Quantité</th>
                <th className="px-6 py-3 text-right">Prix unitaire</th>
                <th className="px-6 py-3 text-right">TVA</th>
                <th className="px-6 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {enInvoice.lines.map((line, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {line.item_information.name}
                      </p>
                      {line.item_information.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {line.item_information.description}
                        </p>
                      )}
                      {line.item_information.sellers_item_identification && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Réf:{" "}
                          {line.item_information.sellers_item_identification}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatNumber(line.invoiced_quantity)}{" "}
                    {line.invoiced_quantity_unit_code}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatNumber(line.price_details.item_net_price)}{" "}
                    {invoice.currency_code}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {line.vat_information.invoiced_item_vat_rate
                      ? `${line.vat_information.invoiced_item_vat_rate}%`
                      : line.vat_information.invoiced_item_vat_category_code}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {formatNumber(line.net_amount)} {invoice.currency_code}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Section */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="max-w-md ml-auto space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Total HT:
            </span>
            <span className="font-medium">
              {formatNumber(invoice.total_amount)} {invoice.currency_code}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">TVA:</span>
            <span className="font-medium">
              {formatNumber(invoice.total_tax_amount)} {invoice.currency_code}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-200 dark:border-slate-700">
            <span>Total TTC:</span>
            <span>
              {formatNumber(invoice.total_amount_with_tax)}{" "}
              {invoice.currency_code}
            </span>
          </div>
        </div>
      </div>

      {/* VAT Breakdown */}
      {enInvoice.vat_break_down && enInvoice.vat_break_down.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
            Détail de la TVA
          </h3>
          <div className="space-y-2">
            {enInvoice.vat_break_down.map((vat, index) => (
              <div
                key={index}
                className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <span className="text-slate-600 dark:text-slate-400">
                  TVA{" "}
                  {vat.vat_category_rate
                    ? `${vat.vat_category_rate}%`
                    : vat.vat_category_code}
                </span>
                <div className="text-right">
                  <div className="font-medium">
                    {formatNumber(parseFloat(vat.vat_category_tax_amount))}{" "}
                    {invoice.currency_code}
                  </div>
                  <div className="text-xs text-slate-500">
                    sur{" "}
                    {formatNumber(parseFloat(vat.vat_category_taxable_amount))}{" "}
                    {invoice.currency_code}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Information */}
      {enInvoice.payment_details && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
            Informations de paiement
          </h3>
          <div className="space-y-2 text-sm">
            {enInvoice.payment_details.payment_terms && (
              <div>
                <span className="text-slate-600 dark:text-slate-400">
                  Conditions:
                </span>
                <p className="font-medium">
                  {enInvoice.payment_details.payment_terms}
                </p>
              </div>
            )}
            {enInvoice.payment_details.credit_transfer &&
              enInvoice.payment_details.credit_transfer.length > 0 && (
                <div>
                  <span className="text-slate-600 dark:text-slate-400">
                    Virement bancaire:
                  </span>
                  {enInvoice.payment_details.credit_transfer.map(
                    (transfer, index) => (
                      <p key={index} className="font-mono text-xs mt-1">
                        {transfer.payment_account_identifier.value}
                      </p>
                    ),
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Notes */}
      {enInvoice.invoice_note && enInvoice.invoice_note.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
            Notes
          </h3>
          <div className="space-y-2">
            {enInvoice.invoice_note.map((note, index) => (
              <p
                key={index}
                className="text-sm text-slate-600 dark:text-slate-400"
              >
                {note.note}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
