import { Button } from "@atoms/button/button";
import { NotFound } from "@atoms/not-found/not-found";
import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useFurnishQuotes } from "@features/invoices/hooks/use-furnish-quotes";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { FursnishQuotesDetails } from "../components/invoice-actions/furnish-quotes-details";

export const FurnishQuotesPage = (_props: { readonly?: boolean }) => {
  const { id } = useParams();
  const { invoice: quote, isPending, restore } = useInvoice(id || "");
  const { refetchFurnishQuotes, isFetchingFurnishQuotes, actionFurnishQuotes } =
    useFurnishQuotes(quote ? [quote] : []);

  if (!quote && isPending)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <PageLoader />
      </div>
    );

  if (!quote && !isPending) {
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <NotFound />
      </div>
    );
  }

  if (!quote) {
    return <></>;
  }

  return (
    <Page
      title={[
        {
          label: getDocumentNamePlurial(quote.type),
          to: getRoute(ROUTES.Invoices, { type: quote.type }),
        },
        { label: quote.reference || "" },
      ]}
      footer={
        <div className="flex items-center justify-end">
          <Button
            disabled={isFetchingFurnishQuotes}
            loading={isFetchingFurnishQuotes}
            onClick={async () => {
              await actionFurnishQuotes();
            }}
          >
            Fournir
          </Button>
        </div>
      }
      bar={
        <DocumentBar
          loading={isPending && !quote}
          entity={"invoices"}
          document={quote || { id }}
          mode={"read"}
          backRoute={getRoute(ROUTES.Invoices, { type: quote.type })}
          onRestore={
            quote?.id ? async () => restore.mutateAsync(quote?.id) : undefined
          }
          suffix={
            <>
              <Button
                className="w-6 h-6"
                onClick={async () => await refetchFurnishQuotes()}
                icon={(p) => (
                  <ArrowPathIcon
                    className={twMerge(p.className, "w-3 h-3")}
                    {..._.omit(p, "className")}
                  />
                )}
              ></Button>
            </>
          }
        />
      }
    >
      <FursnishQuotesDetails id={id} />
    </Page>
  );
};
