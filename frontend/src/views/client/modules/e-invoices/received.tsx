import { Page } from "@/views/client/_layout/page";

export const ReceivedEInvoicesPage = () => {
  return (
    <Page title={[{ label: "Factures électroniques reçues" }]}>
      <div className="-m-3 overflow-auto max-w-[100vw]"></div>
    </Page>
  );
};
