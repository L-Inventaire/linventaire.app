import { Button } from "@atoms/button/button";
import Select from "@atoms/input/input-select";
import { Modal } from "@atoms/modal/modal";
import { Title } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { Contacts } from "@features/contacts/types/types";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { UserGroupIcon } from "@heroicons/react/20/solid";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { AccountingReportPage } from "./accounting";
import { AccountingExportModal } from "./accounting-export";
import { BalancesExportModal, BalancesPage } from "./balances";
import { ProfitabilityExportModal, ProfitabilityPage } from "./profitability";
import { TagsExportModal, TagsPage } from "./tags";

export const StatisticsPage = () => {
  const [page, setPage] = useState<string>("tags");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [profitabilityYears, setProfitabilityYears] = useState<number[]>([
    new Date().getFullYear(),
  ]);
  const [profitabilityClients, setProfitabilityClients] = useState<string[]>(
    []
  );
  const [exportModal, setExportModal] = useState(false);

  const toggleProfitabilityYear = (y: number) => {
    if (profitabilityYears.includes(y)) {
      if (profitabilityYears.length > 1) {
        setProfitabilityYears(profitabilityYears.filter((yr) => yr !== y));
      }
    } else {
      setProfitabilityYears([...profitabilityYears, y].sort((a, b) => b - a));
    }
  };

  return (
    <Page
      title={[
        {
          label: "Comptabilité",
        },
      ]}
    >
      <div className="w-full relative">
        <div className="flex flex-wrap justify-between items-center mt-2 mb-8 gap-4">
          <Title>Tableaux</Title>
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={page}
              onChange={(e) => {
                setPage(e.target.value);
              }}
              className="w-56"
            >
              <option value="tags">Chiffre d'affaires catégorisé</option>
              <option value="balances-clients">Balance clients</option>
              <option value="balances-suppliers">Balance fournisseurs</option>
              <option value="profitability">Bénéfices par clients</option>
              <option value="accounting">Export comptable</option>
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
            {page === "profitability" && (
              <>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    const isSelected = profitabilityYears.includes(y);
                    return (
                      <Button
                        key={y}
                        size="sm"
                        theme={isSelected ? "primary" : "default"}
                        onClick={() => toggleProfitabilityYear(y)}
                      >
                        {y}
                      </Button>
                    );
                  })}
                </div>
                <div className="min-w-48">
                  <RestDocumentsInput<Contacts>
                    entity="contacts"
                    placeholder="Tous les clients"
                    filter={{ is_client: true } as any}
                    value={profitabilityClients}
                    onChange={(ids) => setProfitabilityClients(ids)}
                    max={100}
                    size="sm"
                    icon={(p) => <UserGroupIcon {...p} />}
                    render={(contact) => (
                      <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5 text-sm mr-1">
                        {contact.business_name ||
                          `${contact.person_first_name} ${contact.person_last_name}`}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfitabilityClients(
                              profitabilityClients.filter(
                                (id) => id !== contact.id
                              )
                            );
                          }}
                          className="hover:text-red-500"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  />
                </div>
              </>
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
          {page === "profitability" && (
            <ProfitabilityExportModal
              years={profitabilityYears}
              clientIds={
                profitabilityClients.length > 0
                  ? profitabilityClients
                  : undefined
              }
              onClose={() => setExportModal(false)}
            />
          )}
          {page === "accounting" && (
            <AccountingExportModal onClose={() => setExportModal(false)} />
          )}
        </Modal>

        {page === "tags" && <TagsPage year={year} />}
        {page === "balances-clients" && <BalancesPage type="client" />}
        {page === "balances-suppliers" && <BalancesPage type="supplier" />}
        {page === "profitability" && (
          <ProfitabilityPage
            years={profitabilityYears}
            clientIds={
              profitabilityClients.length > 0 ? profitabilityClients : undefined
            }
          />
        )}
        {page === "accounting" && <AccountingReportPage />}
      </div>
    </Page>
  );
};
