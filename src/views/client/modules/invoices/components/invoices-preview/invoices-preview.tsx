import { Invoices } from "@features/invoices/types/types";
import { PDFLayout } from "@views/client/_layout/pdf";
import _ from "lodash";
import React, { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

import styles from "./styles.module.css";

type InvoicesPreviewProps = {
  invoice: Invoices;
  preview?: boolean;
  color?: CSSProperties["color"];
} & React.ComponentProps<"div">;

export const InvoicesPreviewPage = ({
  invoice,
  preview = false,
  color = "blue",
  ...props
}: InvoicesPreviewProps) => {
  const mainTextColor = `text-${color}-900`;
  const mainBGColor = `bg-${color}-900`;
  const whitenedTextColor = `text-${color}-300`;

  const coloredCaseStyle = twMerge(
    "w-full h-full !p-2 text-white font-normal text-[0.2rem]",
    styles.font,
    mainBGColor,
    !preview && "!px-1 !py-0 h-max"
  );

  return (
    <PDFLayout
      {..._.omit(props, "className")}
      className={twMerge(styles.font, props.className)}
    >
      <div>
        <h1
          className={twMerge(
            styles.font,
            "text-2xl",
            !preview && "text-[0.5rem]",
            mainTextColor
          )}
        >
          Facture
        </h1>
        <h2
          className={twMerge(
            styles.font,
            !preview && "text-[0.3rem]",
            whitenedTextColor
          )}
        >
          N° F-2024-0086 TEST
        </h2>
        <table
          className={twMerge(
            styles.table,
            "w-full mt-3 text-xs",
            !preview && "w-[200px] max-w-[360px] mt-1 ml-0 text-[0.2rem]"
          )}
        >
          <tr className={twMerge("text-left")}>
            <th className={twMerge("text-left")}>Romaric Mourgues</th>
            <th className={twMerge("text-left")}>Praxiel</th>
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
        <table
          className={twMerge(
            styles.table,
            "mt-3 text-xs w-max",
            !preview && "mt-1 ml-0 text-[0.2rem] w-[70px]"
          )}
        >
          <tr className={twMerge(styles.table)}>
            <td
              className={twMerge(
                styles.font,
                whitenedTextColor,
                "font-semibold !pr-3",
                !preview && "font-extrabold !pr-0"
              )}
            >
              Date d'émission
            </td>
            <td>05/01/2024</td>
          </tr>
          <tr>
            <td
              className={twMerge(
                styles.font,
                whitenedTextColor,
                "font-semibold !pr-3",
                !preview && "font-extrabold !pr-0"
              )}
            >
              Date d'exigibilité du paiement
            </td>
            <td>04/02/2024</td>
          </tr>
          <tr>
            <td
              className={twMerge(
                styles.font,
                whitenedTextColor,
                "font-semibold !pr-3",
                !preview && "font-extrabold !pr-0"
              )}
            >
              Date de paiement
            </td>
            <td>05/01/2024</td>
          </tr>
        </table>
        <table
          className={twMerge(
            styles.table,
            "!mt-3 text-xs w-full h-full !border-spacing-x-px border-separate",
            !preview && "ml-0 !border-spacing-x-[0.5px] text-[0.2rem] w-[190px]"
          )}
        >
          <tr className={twMerge("h-full", !preview && "h-[9px]")}>
            <th className={twMerge(coloredCaseStyle, "w-6")}>#</th>
            <th
              className={twMerge(
                coloredCaseStyle,
                "text-left !pl-3 whitespace-nowrap",
                !preview && "!pl-1"
              )}
            >
              Désignation et description
            </th>
            <th
              className={twMerge(coloredCaseStyle, "whitespace-nowrap w-[1%]")}
            >
              Unité
            </th>
            <th
              className={twMerge(coloredCaseStyle, "whitespace-nowrap w-[1%]")}
            >
              Quantité
            </th>
            <th
              className={twMerge(coloredCaseStyle, "whitespace-nowrap w-[1%]")}
            >
              Prix u. HT
            </th>
            <th
              className={twMerge(coloredCaseStyle, "whitespace-nowrap w-[1%]")}
            >
              TVA
            </th>
            <th
              className={twMerge(coloredCaseStyle, "whitespace-nowrap w-[1%]")}
            >
              Montant HT
            </th>
            <th
              className={twMerge(coloredCaseStyle, "whitespace-nowrap w-[1%]")}
            >
              Montant TTC
            </th>
          </tr>
          <tr>
            <td className={"text-center"}>1</td>
            <td className={twMerge("!pl-3", !preview && "!pl-1")}>
              Service et conseil en informatique (jour)
            </td>
            <td className={"text-center"}>unité</td>
            <td className={"text-center"}>2.5</td>
            <td className={"text-center"}>600,00 €</td>
            <td className={"text-center"}>20 %</td>
            <td className={"text-center"}>1 500,00 €</td>
            <td className={"text-center"}>1 800,00 €</td>
          </tr>
        </table>
      </div>
    </PDFLayout>
  );
};
