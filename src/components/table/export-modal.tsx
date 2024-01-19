import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/input/input-select";
import { ModalContent } from "@atoms/modal/modal";
import _ from "lodash";
import { useState } from "react";
import { Pagination } from "./table";

export const TableExportModal = (props: {
  tableName?: string;
  pagination?: Pagination;
  fetchData: (pagination: Pagination) => Promise<any[]>;
  onClose: () => void;
}) => {
  const [exportType, setExportType] = useState("csv");
  const [maxSize, setMaxSize] = useState("100");
  const [loading, setLoading] = useState(false);

  const exportData = async () => {
    setLoading(true);

    const fileName =
      "export-" +
      (props.tableName ? props.tableName + "-" : "") +
      new Date().toISOString();

    let maxItems = parseInt(maxSize);
    let page = 1;
    let data: any[] = [];
    let previousSize = -1;
    while (previousSize !== data.length && data.length < maxItems) {
      const res = await props.fetchData({
        ...(props.pagination || {
          page: 1,
          perPage: 25,
          orderBy: "id" as any,
          orderDir: "ASC",
          total: data.length,
        }),
        page: page || 1,
      });
      previousSize = data.length;
      data = [...data, ...res];
      data = _.uniqBy(data, "id");
      page += 1;
      console.log(data.length, previousSize, maxItems);
    }

    data = data.slice(0, maxItems);

    if (exportType === "csv" && data.length > 0) {
      const header = Object.keys(data[0]).join(",");
      const csv = data.map((row) => {
        return Object.values(row)
          .map((e) => (typeof e === "object" ? JSON.stringify(e) : e))
          .join(",");
      });
      const csvString = header + "\n" + csv.join("\n");

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName + ".csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setLoading(false);
    props.onClose();
  };

  return (
    <ModalContent title="Export">
      <InputLabel
        className="mb-4"
        label="Maximum size"
        input={
          <Select
            onChange={(e) => setMaxSize(e.target.value)}
            disabled={loading}
          >
            <option value="100">100 items</option>
            <option value="100">500 items</option>
            <option value="1000">1 000 items</option>
            <option value="1000">5 000 items</option>
            <option value="10000">10 000 items</option>
          </Select>
        }
      />
      <InputLabel
        className="mb-4"
        label="Export as"
        input={
          <Select
            onChange={(e) => setExportType(e.target.value)}
            disabled={loading}
          >
            <option value="csv">CSV</option>
          </Select>
        }
      />
      <Button
        theme="primary"
        className="w-full mt-2"
        loading={loading}
        onClick={() => exportData()}
      >
        Export
      </Button>
    </ModalContent>
  );
};
