import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { InvoicesColumns } from "@features/invoices/configuration";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { StatisticsApiClient } from "@features/statistics/api-client/api-client";
import { useStatistics } from "@features/statistics/hooks";
import { formatAmount } from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import { Column } from "@molecules/table/table";
import { TableCell, TableCellValue } from "@molecules/table/table-cell";
import { TableRow } from "@molecules/table/table-row";
import { queryOptions, useQueries } from "@tanstack/react-query";
import _ from "lodash";
import { useNavigate, useParams } from "react-router-dom";
import { prettyContactName } from "../contacts/utils";
import { useState } from "react";

export const ClientBalancePage = () => {
  const { client: clientId } = useParams();

  const statistics = useStatistics(clientId, "year");
  const table = statistics?.clientBalanceTable ?? [];
  const clientsIDs = _.uniq(table.map((item) => item.client));
  const clientsData = useContacts({
    query: buildQueryFromMap({ id: clientsIDs }),
  });
  const clients = clientsData.contacts.data?.list ?? [];

  function invoicesOptions(clientID: string, contactID: string) {
    return queryOptions({
      queryKey: ["invocies-for-stats", clientID, "contact", contactID],
      queryFn: async () => {
        return await StatisticsApiClient.getClientBalance(clientID, contactID);
      },
      staleTime: 5 * 1000,
    });
  }

  const [fetchedClients, setFetchedClients] = useState<string[]>([]);

  const invoices_raw = useQueries({
    queries: (fetchedClients ?? []).map((client) =>
      invoicesOptions(clientId ?? "", client)
    ),
  });

  const invoices: (Invoices & { which30Days?: number })[] = [
    ...clients.map((client) => {
      return {
        id: "_",
        client: client.id,
        which30Days: -1,
        total: {
          total_with_taxes: 0,
          total: 0,
          initial: 0,
          discount: 0,
          taxes: 0,
        },
      } as unknown as Invoices & { which30Days?: number };
    }),
    ...invoices_raw
      .flatMap((invoice_query) => [
        ...(invoice_query?.data?.delay30Payments.map((i) => ({
          ...i,
          which30Days: 0,
        })) ?? []),
        ...(invoice_query?.data?.delay60Payments.map((i) => ({
          ...i,
          which30Days: 1,
        })) ?? []),
        ...(invoice_query?.data?.delay90Payments.map((i) => ({
          ...i,
          which30Days: 2,
        })) ?? []),
        ...(invoice_query?.data?.delay120Payments.map((i) => ({
          ...i,
          which30Days: 3,
        })) ?? []),
        ...(invoice_query?.data?.delayMore120Payments.map((i) => ({
          ...i,
          which30Days: 120,
        })) ?? []),
      ])
      .filter(Boolean),
  ];

  const columns: Column<Invoices & { which30Days?: number }>[] = [
    {
      title: "Client",
      id: "client",
      render: (_) => {
        return <></>;
      },
    },
    ...InvoicesColumns.filter((col) =>
      ["emit_date", "reference"].includes(col?.id ?? "")
    ),
    {
      title: "1-30 jours",
      id: "0",
      render: (invoice) => {
        if (invoice.id === "_" || invoice.which30Days !== 0) return <></>;
        return <>{formatAmount(invoice?.total?.total ?? 0)}</>;
      },
    },
    {
      title: "31-60 jours",
      id: "1",
      render: (invoice) => {
        if (invoice.id === "_" || invoice.which30Days !== 1) return <></>;
        return <>{formatAmount(invoice?.total?.total ?? 0)}</>;
      },
    },
    {
      title: "61-90 jours",
      id: "2",
      render: (invoice) => {
        if (invoice.id === "_" || invoice.which30Days !== 2) return <></>;
        return <>{formatAmount(invoice?.total?.total ?? 0)}</>;
      },
    },
    {
      title: "91-120 jours",
      id: "3",
      render: (invoice) => {
        if (invoice.id === "_" || invoice.which30Days !== 3) return <></>;
        return <>{formatAmount(invoice?.total?.total ?? 0)}</>;
      },
    },
    {
      title: ">120 jours",
      id: "120",
      render: (invoice) => {
        if (invoice.id === "_" || (invoice?.which30Days ?? 0) < 4) return <></>;
        return <>{formatAmount(invoice?.total?.total ?? 0)}</>;
      },
    },
  ];

  const navigate = useNavigate();

  return (
    <>
      <Table
        border
        data={invoices}
        columns={columns}
        groupBy={(invoice) => {
          return invoice.client;
        }}
        groupByClosable
        onClick={(invoice) => {
          if (invoice.id === "_") return;
          navigate(getRoute(ROUTES.InvoicesView, { id: invoice.id }));
        }}
        groupByRenderBlank
        groupByRender={(invoice, i, __, toggleGroup) => {
          const foundClient = clients.find(
            (client) => client.id === invoice.client
          );

          return (
            <>
              <TableRow
                data={invoices}
                className=""
                onClick={(__, e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  e.preventDefault();

                  toggleGroup?.();

                  if (!fetchedClients.includes(invoice.client)) {
                    setFetchedClients((clients) =>
                      _.uniq([...clients, invoice.client])
                    );
                  }
                }}
              >
                <TableCell></TableCell>
                <TableCellValue<Invoices>
                  key={i}
                  i={i}
                  j={0}
                  data={invoices}
                  row={invoice}
                  cell={{
                    title: "Client",
                    id: "client",
                    render: (__: any) => {
                      if (!foundClient) return <>Autres</>;
                      return prettyContactName(foundClient);
                    },
                  }}
                  columns={columns}
                />
                <TableCell odd={!!(i % 2)}></TableCell>
                <TableCell odd={!!(i % 2)}></TableCell>
                {columns
                  .filter((a) => !a.hidden)
                  .filter(
                    (a) =>
                      ![
                        "client",
                        "emit_date",
                        "reference",
                        "closable",
                        "0",
                        "1",
                        "2",
                        "3",
                        "120",
                      ].includes(a.id ?? "")
                  )
                  .map((column, j) => (
                    <TableCell
                      odd={!!(i % 2)}
                      last={j === columns.length - 1}
                      key={j}
                    >
                      {column.render(invoice, { responsive: false })}
                    </TableCell>
                  ))}
                {columns
                  .filter((a) => !a.hidden)
                  .filter((a) => ["0", "1", "2", "3"].includes(a.id ?? ""))
                  .map((column, j) => {
                    const item = table.find((it) => {
                      return (
                        it.client === invoice.client &&
                        it.which30days === parseInt(column.id ?? "0")
                      );
                    });

                    return (
                      <TableCell
                        odd={!!(i % 2)}
                        last={j === columns.length - 1}
                        key={j}
                      >
                        {formatAmount(item?.total ?? 0)}
                      </TableCell>
                    );
                  })}
                {columns
                  .filter((a) => !a.hidden)
                  .filter((a) => ["120"].includes(a.id ?? ""))
                  .map((__, j) => {
                    const item = table.find(
                      (it) => it.client === invoice.client
                    );

                    return (
                      <TableCell
                        odd={!!(i % 2)}
                        last={j === columns.length - 1}
                        key={j}
                      >
                        {formatAmount(
                          invoices.find(() => (item?.which30days || 0) >= 5)
                            ?.total?.total ?? 0
                        )}
                      </TableCell>
                    );
                  })}
              </TableRow>
            </>
          );
        }}
      />
    </>
  );
};
