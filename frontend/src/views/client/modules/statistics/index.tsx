import { Button } from "@atoms/button/button";
import Select from "@atoms/input/input-select";
import { Modal } from "@atoms/modal/modal";
import { Title } from "@atoms/text";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { TagsPage, TagsExportModal } from "./tags";
import { BalancesPage, BalancesExportModal } from "./balances";
import { AccountingExportModal } from "./accounting-export";

export const StatisticsPage = () => {
  const [page, setPage] = useState<string>("tags");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [exportModal, setExportModal] = useState(false);
  const [accountingExportModal, setAccountingExportModal] = useState(false);

  return (
    <Page
      title={[
        {
          label: "Comptabilité",
        },
      ]}
    >
      <div className="w-full relative">
        <div className="flex justify-between items-center mt-2 mb-8 space-x-4">
          <Title>Tableaux</Title>
          <div className="flex gap-2">
            <Select
              onChange={(e) => {
                setPage(e.target.value);
              }}
              className="w-56"
            >
              <option value="tags">Chiffre d'affaires catégorisé</option>
              <option value="balances-clients">Balance clients</option>
              <option value="balances-suppliers">Balance fournisseurs</option>
            </Select>
            {page === "tags" && (
              <Select
                value={year.toString()}
                onChange={(e) => {
                  setYear(parseInt(e.target.value));
                }}
                className="w-max"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </Select>
            )}
          </div>
          <div className="grow" />
          <div className="flex gap-2">
            <Button
              theme="default"
              size="sm"
              icon={(p) => <ArrowDownTrayIcon {...p} />}
              onClick={() => setExportModal(true)}
            >
              Exporter
            </Button>
            <Button
              theme="outlined"
              size="sm"
              onClick={() => setAccountingExportModal(true)}
            >
              Export comptable
            </Button>
          </div>
        </div>

        <Modal open={exportModal} onClose={() => setExportModal(false)}>
          {page === "tags" && (
            <TagsExportModal
              year={year}
              onClose={() => setExportModal(false)}
            />
          )}
          {page === "balances-clients" && (
            <BalancesExportModal
              type="client"
              onClose={() => setExportModal(false)}
            />
          )}
          {page === "balances-suppliers" && (
            <BalancesExportModal
              type="supplier"
              onClose={() => setExportModal(false)}
            />
          )}
        </Modal>

        <Modal
          open={accountingExportModal}
          onClose={() => setAccountingExportModal(false)}
        >
          <AccountingExportModal
            onClose={() => setAccountingExportModal(false)}
          />
        </Modal>

        {page === "tags" && <TagsPage year={year} />}
        {page === "balances-clients" && <BalancesPage type="client" />}
        {page === "balances-suppliers" && <BalancesPage type="supplier" />}
      </div>
    </Page>
  );
};
