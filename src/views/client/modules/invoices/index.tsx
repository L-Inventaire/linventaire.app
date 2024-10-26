import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { RestTable } from "@components/table-rest";
import { InvoicesColumns } from "@features/invoices/configuration";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { formatNumber } from "@features/utils/format/strings";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
  useRestSuggestions,
} from "@features/utils/rest/hooks/use-rest";
import { ArrowUturnLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Badge, Tabs } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { SearchBar } from "../../../../components/search-bar";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "../../../../components/search-bar/utils/utils";
import { InvoiceStatus } from "./components/invoice-status";

const activeFilter = [
  {
    key: "state",
    not: true,
    values: [
      {
        op: "equals",
        value: "draft",
      },
      {
        op: "equals",
        value: "closed",
      },
    ],
  },
];

export const InvoicesPage = () => {
  const tabs = {
    active: { label: "Actifs", filter: activeFilter },
    draft: {
      label: "Brouillons",
      filter: buildQueryFromMap({ state: "draft" }),
    },
    closed: {
      label: "Archivés",
      filter: buildQueryFromMap({ state: "closed" }),
    },
    all: { label: "Tous", filter: [] },
  };
  const [activeTab, setActiveTab] = useState("active");

  const type: Invoices["type"][] = (useParams().type?.split("+") || [
    "invoices",
  ]) as any;
  const [options, setOptions] = useState<RestOptions<Invoices>>({
    limit: 10,
    offset: 0,
    query: [],
  });

  const invoiceFilters = {
    ...options,
    index: "state,emit_date",
    query: [...((options?.query as any) || []), ...buildQueryFromMap({ type })],
  };

  const { invoices } = useInvoices({
    ...invoiceFilters,
    query: [
      ...invoiceFilters.query,
      ...((tabs as any)[activeTab]?.filter || []),
    ],
  });

  const schema = useRestSchema("invoices");
  const navigate = useNavigateAlt();

  // Counters
  const { invoices: draftInvoices } = useInvoices({
    key: "draftInvoices",
    limit: 1,
    query: [...invoiceFilters.query, ...tabs.draft.filter],
  });
  const { invoices: activeInvoices } = useInvoices({
    key: "activeInvoices",
    limit: 1,
    query: [...invoiceFilters.query, ...activeFilter],
  });

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
        <div className="px-3 min-h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Tabs.Root onValueChange={setActiveTab} value={activeTab}>
            <Tabs.List className="flex space-x-2 -mx-3 -mb-px items-center">
              {Object.entries(tabs).map(([key, label]) => (
                <Tabs.Trigger key={key} value={key}>
                  {label.label}
                  {["draft", "active"].includes(key) && (
                    <Badge className="ml-2">
                      {key === "draft"
                        ? formatNumber(draftInvoices?.data?.total || 0)
                        : formatNumber(activeInvoices?.data?.total || 0)}
                    </Badge>
                  )}
                </Tabs.Trigger>
              ))}
              <div className="grow" />
              <Info className="pr-3">
                {formatNumber(invoices?.data?.total || 0)} documents trouvés
              </Info>
            </Tabs.List>
          </Tabs.Root>
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
          columns={InvoicesColumns}
        />
      </div>
    </Page>
  );
};
