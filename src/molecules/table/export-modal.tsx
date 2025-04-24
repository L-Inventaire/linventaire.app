import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/input/input-select";
import { ModalContent } from "@atoms/modal/modal";
import _ from "lodash";
import { useState } from "react";
import * as XLSX from "xlsx";
import { Pagination } from "./table";
import { Badge } from "@radix-ui/themes";

export const TableExportModal = (props: {
  tableName?: string;
  pagination?: Pagination;
  fetchData: (
    pagination: Pick<Pagination, "page" | "perPage">
  ) => Promise<any[]>;
  onClose: () => void;
}) => {
  const [exportType, setExportType] = useState("csv");
  const [maxSize, setMaxSize] = useState("100");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportData = async () => {
    setLoading(true);
    setProgress(0);

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
        perPage: 500,
        page: page || 1,
      });
      previousSize = data.length;
      data = [...data, ...res];
      data = _.uniqBy(data, "id");
      page += 1;
      setProgress(Math.round((data.length / maxItems) * 100));
    }
    setProgress(100);

    data = data.slice(0, maxItems);

    if (exportType === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, fileName);
      XLSX.writeFile(workbook, `${fileName}.xlsx`, {
        compression: true,
      });
    } else if (exportType === "csv") {
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
      <Badge color="yellow" className="mb-4">
        This feature is still in beta.
      </Badge>

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
            <option value="xlsx">Excel</option>
          </Select>
        }
      />
      <Button
        theme="primary"
        className="w-full mt-2"
        disabled={loading}
        onClick={() => {
          exportData();
        }}
      >
        {loading ? progress + "%" : "Export"}
      </Button>
    </ModalContent>
  );
};
