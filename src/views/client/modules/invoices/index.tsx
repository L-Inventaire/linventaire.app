import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { RestTable } from "@components/table-rest";
import { CtrlKRestEntities } from "@features/ctrlk";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { ArrowUturnLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { SearchBar } from "../../../../components/search-bar";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "../../../../components/search-bar/utils/utils";
import { InvoiceStatus } from "./components/invoice-status";

export const InvoicesPage = () => {
  const type: Invoices["type"][] = (useParams().type?.split("+") || [
    "invoices",
  ]) as any;
  const [options, setOptions] = useState<RestOptions<Invoices>>({
    limit: 10,
    offset: 0,
    query: [],
  });

  const { invoices } = useInvoices({
    ...options,
    index: "state,emit_date",
    query: [...((options?.query as any) || []), ...buildQueryFromMap({ type })],
  });

  const schema = useRestSchema("invoices");
  const navigate = useNavigateAlt();

  return (
    <Page
      title={[{ label: getDocumentNamePlurial(type[0]) }]}
      bar={
        <SearchBar
          schema={{
            table: "invoices",
            fields: schemaToSearchFields(schema.data, {
              tags: {
                label: "Étiquettes",
                keywords: "tags étiquettes label",
              },
              updated_at: "Date de mise à jour",
              updated_by: {
                label: "Mis à jour par",
                keywords: "updated_by mis à jour par auteur utilisateur user",
              },
              type: {
                label: "Type",
                keywords: "type devis avoirs factures",
              },
            }),
          }}
          onChange={(q) =>
            q.valid && setOptions({ ...options, query: q.fields })
          }
          suffix={
            ["supplier_invoices", "supplier_credit_notes"].includes(type[0]) ? (
              <>
                <Button
                  size="sm"
                  theme="outlined"
                  to={withSearchAsModel(
                    getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                    schema.data,
                    { type: "supplier_credit_notes" }
                  )}
                  icon={(p) => <ArrowUturnLeftIcon {...p} />}
                >
                  Avoir fournisseur
                </Button>
                <Button
                  size="sm"
                  to={withSearchAsModel(
                    getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                    schema.data,
                    { type: "supplier_invoices" }
                  )}
                  icon={(p) => <PlusIcon {...p} />}
                >
                  Facture fournisseur
                </Button>
              </>
            ) : ["supplier_quotes"].includes(type[0]) ? (
              <>
                <Button
                  size="sm"
                  to={withSearchAsModel(
                    getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                    schema.data,
                    { type: "supplier_quotes" }
                  )}
                  icon={(p) => <PlusIcon {...p} />}
                >
                  Commande
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  theme="outlined"
                  to={withSearchAsModel(
                    getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                    schema.data,
                    { type: "credit_notes" }
                  )}
                  icon={(p) => <ArrowUturnLeftIcon {...p} />}
                >
                  Avoir
                </Button>
                <Button
                  size="sm"
                  to={withSearchAsModel(
                    getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                    schema.data,
                    { type: "quotes" }
                  )}
                  icon={(p) => <PlusIcon {...p} />}
                >
                  Devis
                </Button>
                <Button
                  size="sm"
                  to={withSearchAsModel(
                    getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                    schema.data,
                    { type: "invoices" }
                  )}
                  icon={(p) => <PlusIcon {...p} />}
                >
                  Facture
                </Button>
              </>
            )
          }
        />
      }
    >
      <div className="-m-3">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Info>{invoices?.data?.total || 0} documents trouvés</Info>
        </div>
        <RestTable
          groupBy="state"
          groupByRender={(row) => (
            <div className="mt-px">
              <InvoiceStatus
                size="xs"
                readonly
                value={row.state}
                type={row.type}
              />
            </div>
          )}
          entity="invoices"
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.InvoicesView, { id }), { event })
          }
          data={invoices}
          showPagination="full"
          onRequestData={async (page) => {
            setOptions({
              ...options,
              limit: page.perPage,
              offset: (page.page - 1) * page.perPage,
              asc: page.order === "ASC",
            });
          }}
          columns={CtrlKRestEntities["invoices"].renderResult as any}
        />
      </div>
    </Page>
  );
};
