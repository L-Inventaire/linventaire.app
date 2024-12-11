import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { InvoicesColumns } from "@features/invoices/configuration";
import { Invoices } from "@features/invoices/types/types";
import { useStatistics } from "@features/statistics/hooks";
import { formatAmount } from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import { Column } from "@molecules/table/table";
import { TableCell } from "@molecules/table/table-cell";
import { TableRow } from "@molecules/table/table-row";
import _ from "lodash";
import { useParams } from "react-router-dom";
import { prettyContactName } from "../contacts/utils";

export const ClientBalancePage = () => {
  const { client: clientId } = useParams();

  const statistics = useStatistics(clientId, "year");
  const data = statistics.clientBalanceTable;
  const tableData = Object.values(data).flatMap((item) => item);
  const clientsIDs = _.uniq(tableData.map((item) => item.client));
  const clientsData = useContacts({
    query: buildQueryFromMap({ id: clientsIDs }),
  });
  const clients = clientsData.contacts.data?.list ?? [];

  const columns: Column<Invoices>[] = [
    {
      title: "Client",
      id: "client",
      render: (invoice) => {
        return <></>;
      },
    },
    ...InvoicesColumns.filter((col) =>
      ["emit_date", "reference"].includes(col?.id ?? "")
    ),
    {
      title: "1-30",
      id: "1-30",
      render: (invoice) => {
        const invoices = data[0];
        const found = invoices?.find((inv) => inv.id === invoice.id)?.total;
        if (!found) return <></>;

        return formatAmount(found?.total_with_taxes);
      },
    },
    {
      title: "31-60",
      id: "30-60",
      render: (invoice) => {
        const invoices = data[30];
        const found = invoices?.find((inv) => inv.id === invoice.id)?.total;
        if (!found) return <></>;

        return formatAmount(found?.total_with_taxes);
      },
    },
    {
      title: "61-90",
      id: "60-90",
      render: (invoice) => {
        const invoices = data[60];
        const found = invoices?.find((inv) => inv.id === invoice.id)?.total;
        if (!found) return <></>;

        return formatAmount(found?.total_with_taxes);
      },
    },
    {
      title: "91-120",
      id: "91-120",
      render: (invoice) => {
        const invoices = data[90];
        const found = invoices?.find((inv) => inv.id === invoice.id)?.total;
        if (!found) return <></>;

        return formatAmount(found?.total_with_taxes);
      },
    },
    {
      title: ">120",
      id: ">120",
      render: (invoice) => {
        // Pick invoices with more than 120 days of payment delay
        const invoicesData = _.pickBy(
          data,
          (_, key) => !["0", "30", "60", "90"].includes(key)
        ) as { [key: string]: Invoices[] };
        console.log("invoicesData", invoicesData);

        const found = (Object.values(invoicesData) || [])
          .flat()
          .find((inv) => inv.id === invoice.id);

        if (!found || !found?.total) return <></>;

        return formatAmount(found.total?.total_with_taxes);
      },
    },
  ];

  return (
    <>
      <Table
        border
        data={tableData}
        columns={columns}
        groupBy={(invoice) => {
          return invoice.client;
        }}
        groupByRenderBlank
        groupByRender={(invoice) => {
          const foundClient = clients.find(
            (client) => client.id === invoice.client
          );
          const invoices = tableData.filter(
            (item) => item.client === invoice.client
          );
          const rowIndex = invoices.length;

          return (
            <>
              <TableRow data={data} className="">
                <TableCell<Invoices>
                  key={0}
                  i={rowIndex}
                  j={-1}
                  data={tableData}
                  row={invoice}
                  cell={{
                    title: "Client",
                    id: "client",
                    render: (invoice) => {
                      if (!foundClient) return <>Autres</>;
                      return prettyContactName(foundClient);
                    },
                  }}
                  columns={columns}
                />
                {columns
                  .filter((a) => !a.hidden)
                  .filter((a) => a.id !== "client")
                  .map((column, j) => (
                    <TableCell<Invoices>
                      key={0}
                      i={rowIndex}
                      j={j}
                      data={tableData}
                      row={invoice}
                      cell={column}
                      columns={columns}
                    />
                  ))}
              </TableRow>
            </>
          );
        }}
      />
    </>
  );
};
