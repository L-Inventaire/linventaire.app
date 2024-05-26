import { Invoices } from "@features/invoices/types/types";
import { PDFLayout } from "@views/client/_layout/pdf";
import _ from "lodash";
import React, { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

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
      className={twMerge(props.className)}
    >
      <div>
        <h1
          className={twMerge(
            "font-extrabold",
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
        <table className={twMerge(!preview && "text-[0.2rem]")}>
          <tr>
            <th>Romaric Mourgues</th>
          </tr>
          <tr>
            <td>Alfreds Futterkiste</td>
          </tr>
          <tr>
            <td>Centro comercial Moctezuma</td>
          </tr>
        </table>
      </div>
    </PDFLayout>
  );
};
