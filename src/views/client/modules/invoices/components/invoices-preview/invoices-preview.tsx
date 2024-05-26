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
  return (
    <PDFLayout
      {..._.omit(props, "className")}
      className={twMerge(styles.root, props.className)}
    >
      <div>
        <h1
          className={twMerge(
            "font-extrabold text-2xl",
            !preview && "text-[0.5rem]",
            `text-${color}-900`
          )}
        >
          Facture
        </h1>
        <h2
          className={twMerge(
            "font-extrabold",
            !preview && "text-[0.3rem]",
            `text-${color}-500`
          )}
        >
          N° F-2024-0086 TEST
        </h2>
        <table
          className={twMerge(
            styles.table,
            "mt-3 text-xs",
            !preview && "mt-1 ml-0 text-[0.2rem]"
          )}
        >
          <tr className={twMerge("text-left -py-10")}>
            <th className={twMerge("text-left -py-10")}>Romaric Mourgues</th>
          </tr>
          <tr>
            <td className={twMerge("text-left -py-3")}>
              303 route de la Wantzenau
            </td>
          </tr>
          <tr>
            <td className={twMerge("text-left -py-3 font-['Arial']")}>
              <span>romaric&#46;mollard&#64;gmail&#46;com</span>
            </td>
          </tr>
          <tr>
            <td>67000 STRASBOURG France</td>
          </tr>
          <tr>
            <td>N° SIRET : 81196859300012</td>
          </tr>
          <tr>
            <td>N° TVA : FR81811968593</td>
          </tr>
        </table>
      </div>
    </PDFLayout>
  );
};
