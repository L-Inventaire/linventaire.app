import { Invoices } from "@features/invoices/types/types";
import styles from "./styles.module.css";

type InvoicesPreviewProps = {
  invoice: Invoices;
};

export const InvoicesPreviewPage = ({ invoice }: InvoicesPreviewProps) => {
  return (
    <div id="invoice-preview">
      <h1 className={styles.title}>Facture</h1>
      <h2 className={styles.subtitle}>N° F-2024-0086</h2>
    </div>
  );
};
