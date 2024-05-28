import { Invoices } from "@features/invoices/types/types";

type InvoicesPreviewProps = {
  invoice: Invoices;
};

export function InvoicesPreview({ invoice }: InvoicesPreviewProps) {
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
            <th className="contrast">Romaric Mourgues</th>
            <th className="contrast">Praxiel</th>
          </tr>
          <tr>
            <td>303 route de la Wantzenau</td>
            <td>5 PL COLONEL FABIEN</td>
          </tr>
          <tr>
            <td>romaric&#46;mollard&#64;gmail&#46;com</td>
            <td>75010 PARIS 10 France</td>
          </tr>
          <tr>
            <td>67000 STRASBOURG France</td>
            <td>N° SIRET : 34333687100037</td>
          </tr>
          <tr>
            <td>N° SIRET : 81196859300012</td>
          </tr>
          <tr>
            <td>N° TVA : FR81811968593</td>
          </tr>
        </table>
        <div className="marginxdiv"></div>

        <table className="table" style={{ width: "350px" }}>
          <tr>
            <td className="whitened" style={{ fontWeight: "800" }}>
              Date d'émission
            </td>
            <td>05/01/2024</td>
          </tr>
          <tr>
            <td className="whitened" style={{ fontWeight: "800" }}>
              Date d'exigibilité du paiement
            </td>
            <td>04/02/2024</td>
          </tr>
          <tr>
            <td className="whitened" style={{ fontWeight: "800" }}>
              Date de paiement
            </td>
            <td>05/01/2024</td>
          </tr>
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
            <tr style={{ textAlign: "center" }}>
              <td>1</td>
              <td style={{ textAlign: "left" }}>
                <div className="margindiv"></div>Service et conseil en
                informatique (jour)
              </td>
              <td>unité</td>
              <td>2.5</td>
              <td>600,00 €</td>
              <td>20 %</td>
              <td>1 500,00 €</td>
              <td>1 800,00 €</td>
            </tr>
            <tr style={{ textAlign: "center" }}>
              <td>1</td>
              <td style={{ textAlign: "left" }}>
                <div className="margindiv"></div>Service et conseil en
                informatique (jour)
              </td>
              <td>unité</td>
              <td>2.5</td>
              <td>600,00 €</td>
              <td>20 %</td>
              <td>1 500,00 €</td>
              <td>1 800,00 €</td>
            </tr>
            <tr style={{ textAlign: "center" }}>
              <td>1</td>
              <td style={{ textAlign: "left" }}>
                <div className="margindiv"></div>Service et conseil en
                informatique (jour)
              </td>
              <td>unité</td>
              <td>2.5</td>
              <td>600,00 €</td>
              <td>20 %</td>
              <td>1 500,00 €</td>
              <td>1 800,00 €</td>
            </tr>
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
                <td>30 jours</td>
              </tr>
              <tr>
                <td className="contrast" style={{ fontWeight: "800" }}>
                  Pénalité de retard
                </td>
              </tr>
              <tr>
                <td>3 fois le taux légal</td>
              </tr>
              <tr>
                <td className="contrast" style={{ fontWeight: "800" }}>
                  Indemnité forfaitaire pour frais de recouvrement
                </td>
              </tr>
              <tr>
                <td>40 €</td>
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
                <td>Virement</td>
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
                  1 500,00 €<div className="margindiv_right_small"></div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="margindiv_small"></div>TVA
                </td>
                <td style={{ textAlign: "end" }}>
                  300,00 €<div className="margindiv_right_small"></div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="margindiv_small"></div>Dont 20 %
                </td>
                <td style={{ textAlign: "end" }}>
                  300,00 €<div className="margindiv_right_small"></div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="margindiv_small"></div>Total TTC
                  <div className="marginxdiv"></div>
                </td>
                <td style={{ textAlign: "end" }}>
                  1 800,00 €<div className="margindiv_right_small"></div>
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
