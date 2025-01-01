import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { InvoicesColumns } from "@features/invoices/configuration";
import { Invoices } from "@features/invoices/types/types";
import { useStatistics } from "@features/statistics/hooks";
import { formatAmount } from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import { Column } from "@molecules/table/table";
import { TableCell, TableCellValue } from "@molecules/table/table-cell";
import { TableRow } from "@molecules/table/table-row";
import _ from "lodash";
import { useNavigate, useParams } from "react-router-dom";
import { prettyContactName } from "../contacts/utils";
import { getRoute, ROUTES } from "@features/routes";

export const ClientBalancePage = () => {
  const { client: clientId } = useParams();

  const statistics = useStatistics(clientId, "year");
  const table = statistics?.clientBalanceTable ?? [];
  const clientsIDs = _.uniq(table.map((item) => item.client));
  const clientsData = useContacts({
    query: buildQueryFromMap({ id: clientsIDs }),
  });
  const clients = clientsData.contacts.data?.list ?? [];

  const invoices: Invoices[] = clients.map((client) => {
    return {
      id: "_",
      client: client.id,
      total: {
        total_with_taxes: 0,
        total: 0,
        initial: 0,
        discount: 0,
        taxes: 0,
      },
    } as unknown as Invoices;
  });

  console.log("clients", clients);
  console.log("invoices", invoices);

  const columns: Column<Invoices>[] = [
    {
      title: "Client",
      id: "client",
      render: (__) => {
        return <></>;
      },
    },
    ...InvoicesColumns.filter((col) =>
      ["emit_date", "reference"].includes(col?.id ?? "")
    ),
    {
      title: "1-30 jours",
      id: "1",
      render: (invoice) => {
        const found = table?.find(
          (i) => i.which30days === invoice.id && invoice.client === i.client
        )?.total;

        console.log("table", table);
        console.log("found", found);

        if (!found) return <></>;

        return formatAmount(found);
      },
    },
    {
      title: "31-60 jours",
      id: "2",
      render: (invoice) => {
        const found = table?.find(
          (i) => i.which30days > invoice.id && invoice.client === i.client
        )?.total;
        if (!found) return <></>;

        return formatAmount(found);
      },
    },
    {
      title: "61-90 jours",
      id: "3",
      render: (invoice) => {
        const found = table?.find(
          (i) => i.which30days > invoice.id && invoice.client === i.client
        )?.total;
        if (!found) return <></>;

        return formatAmount(found);
      },
    },
    {
      title: "91-120 jours",
      id: "4",
      render: (invoice) => {
        const found = table?.find(
          (i) => i.which30days > invoice.id && invoice.client === i.client
        )?.total;
        if (!found) return <></>;

        return formatAmount(found);
      },
    },
    {
      title: ">120 jours",
      id: "120",
      render: (invoice) => {
        const found = table?.find(
          (i) => i.which30days > invoice.id && invoice.client === i.client
        )?.total;
        if (!found) return <></>;

        return formatAmount(found);
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
          navigate(getRoute(ROUTES.InvoicesView, { id: invoice.id }));
        }}
        defaultGroups={invoices}
        groupByRenderBlank
        groupByRender={(invoice, i, renderClosable, toggleGroup) => {
          const foundClient = clients.find(
            (client) => client.id === invoice.client
          );

          return (
            <>
              <TableRow
                data={invoices}
                className=""
                onClick={() => toggleGroup?.()}
              >
                {renderClosable?.()}
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
                        "1",
                        "2",
                        "3",
                        "4",
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
                  .filter((a) => ["1", "2", "3", "4"].includes(a.id ?? ""))
                  .map((column, j) => {
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
                          invoices.find(
                            (inv) =>
                              item?.which30days === parseInt(column.id ?? "0")
                          )?.total?.total ?? 0
                        )}
                      </TableCell>
                    );
                  })}
                {columns
                  .filter((a) => !a.hidden)
                  .filter((a) => ["120"].includes(a.id ?? ""))
                  .map((column, j) => {
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
                          invoices.find((inv) => (item?.which30days || 0) >= 5)
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
