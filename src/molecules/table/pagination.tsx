import { Button } from "@atoms/button/button";
import Select from "@atoms/input/input-select";
import { Info } from "@atoms/text";
import { formatNumber } from "@features/utils/format/strings";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

type PropsType = {
  dataLength: number;
  pagination: {
    total: number;
    page: number;
    perPage: number;
    orderBy?: string;
    order?: "ASC" | "DESC";
  };
  loading?: boolean;
  onChangePage?: (page: number) => void;
  onChangePageSize?: (size: number) => void;
};

export function TablePaginationSimple({
  dataLength,
  loading,
  pagination,
  onChangePage,
}: PropsType) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex w-full flex-col justify-center items-center space-y-2 my-2">
        <div className="items-center flex flex-row">
          {!!onChangePage && (
            <>
              <Button
                theme="default"
                size="md"
                disabled={
                  loading ||
                  pagination.page ===
                    Math.ceil(pagination.total / pagination.perPage)
                }
                onClick={() =>
                  onChangePage && onChangePage(pagination.page + 1)
                }
                className="!px-1.5 rounded-l-none shrink-0"
              >
                {t("general.tables.more")}
              </Button>
            </>
          )}
        </div>
        <div>
          <Info>
            {t("general.tables.pagination", {
              current: formatNumber(dataLength),
              total: formatNumber(pagination.total),
            })}
          </Info>
        </div>
      </div>
    </>
  );
}

export function TablePagination({
  dataLength,
  loading,
  pagination,
  onChangePage,
  onChangePageSize,
}: PropsType) {
  const offset = pagination.perPage * (pagination.page - 1);
  return (
    <>
      <div className="flex w-full items-center">
        <div className="grow">
          <Info>
            Résultats {formatNumber(offset + 1)} à{" "}
            {formatNumber(offset + dataLength)} sur{" "}
            {formatNumber(pagination.total)}
          </Info>
        </div>
        <div className="items-center flex flex-row space-x-2">
          {!!onChangePageSize && (
            <>
              <Info className="whitespace-nowrap mr-2">Par page</Info>
              <Select
                className="shrink-0 w-max"
                disabled={loading}
                size="md"
                value={pagination.perPage || "10"}
                onChange={(e) =>
                  onChangePageSize && onChangePageSize(+e.target.value)
                }
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </>
          )}
          {!!onChangePage && (
            <div className="items-center flex flex-row">
              <Button
                theme="default"
                size="sm"
                disabled={loading || pagination.page === 1}
                onClick={() => onChangePage && onChangePage(1)}
                className="!px-1.5 -mr-px ml-4 rounded-r-none shrink-0"
                icon={(p) => <ChevronDoubleLeftIcon {...p} />}
              />
              <Button
                theme="default"
                size="sm"
                disabled={loading || pagination.page === 1}
                onClick={() =>
                  onChangePage && onChangePage(pagination.page - 1)
                }
                className="!px-1.5 -mr-px rounded-none shrink-0"
                icon={(p) => <ChevronLeftIcon {...p} />}
              />
              <Button
                theme="default"
                size="sm"
                disabled={loading}
                className="-mr-px rounded-none pointer-events-none shrink-0"
              >
                {pagination.page}
              </Button>
              <Button
                theme="default"
                size="sm"
                disabled={
                  loading ||
                  pagination.page ===
                    Math.ceil(pagination.total / pagination.perPage)
                }
                onClick={() =>
                  onChangePage && onChangePage(pagination.page + 1)
                }
                className="!px-1.5 -mr-px rounded-none shrink-0"
                icon={(p) => <ChevronRightIcon {...p} />}
              />
              <Button
                theme="default"
                size="sm"
                disabled={
                  loading ||
                  pagination.page ===
                    Math.ceil(pagination.total / pagination.perPage)
                }
                onClick={() =>
                  onChangePage &&
                  onChangePage(Math.ceil(pagination.total / pagination.perPage))
                }
                className="!px-1.5 rounded-l-none shrink-0"
                icon={(p) => <ChevronDoubleRightIcon {...p} />}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
