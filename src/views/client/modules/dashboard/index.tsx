import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { getRoute, ROUTES } from "@features/routes";
import { useStatistics } from "@features/statistics/hooks";
import { formatTime } from "@features/utils/format/dates";
import { formatAmount } from "@features/utils/format/strings";
import {
  ArrowTurnRightDownIcon,
  ArrowTurnRightUpIcon,
  AtSymbolIcon,
  BanknotesIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { computeDeliveryDelayDate } from "../invoices/utils";
import AccountingCard from "./components/accounting-card";
import MainChart from "./components/main-chart";
import NumberCard from "./components/number-card";
import TableCard from "./components/table-card";

export const DashboardHomePage = () => {
  const { client: clientId } = useParams();
  const [period, setPeriod] = useState<"week" | "month" | "year">("year");
  const statistics = useStatistics(clientId, period);

  const navigate = useNavigate();

  return (
    <Page
      title={[
        {
          label: "Tableau de bord",
        },
      ]}
      // scrollAreaProps={{ style: { height: "100vh" } }}
      scrollAreaChildProps={{ style: { height: "80vh" } }}
    >
      <div className="flex items-center mb-6 ml-3 mt-3">
        <Title>Tableau de bord</Title>
        {false && (
          <>
            <div className="w-[1px] min-h-1 h-full bg-slate-200 mx-6">‎</div>
            <Button
              theme={period === "week" ? "secondary" : "outlined"}
              className="mr-1"
              onClick={() => {
                setPeriod("week");
              }}
            >
              Semaine
            </Button>
            <Button
              theme={period === "month" ? "secondary" : "outlined"}
              className="mr-1"
              onClick={() => {
                setPeriod("month");
              }}
            >
              Mois
            </Button>
            <Button
              theme={period === "year" ? "secondary" : "outlined"}
              className="mr-1"
              onClick={() => {
                setPeriod("year");
              }}
            >
              Année
            </Button>
          </>
        )}
      </div>
      <div className="flex flex-col lg:flex-row px-3 h-full max-h-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px_1fr_250px] lg:grid-rows-[calc(50%-5px)_calc(50%-5px)] w-full lg:w-2/3 gap-[10px] mr-[10px]">
          <div className="w-full min-h-64 lg:h-full lg:col-span-3">
            <MainChart period={period} />
          </div>
          <AccountingCard className={"min-h-64"}></AccountingCard>
          <TableCard
            title="Livraisons bientôt en retard"
            className={"lg:col-span-2"}
            tableProps={{
              className: "grid-cols-[1fr_2fr_1fr]",
            }}
            rows={statistics.almostLateDeliveriesEntities.flatMap(
              (quote, index) => {
                return {
                  key: index.toString(),
                  items: [
                    {
                      row: index,
                      column: "delivery",
                      label: formatTime(
                        computeDeliveryDelayDate(quote).toJSDate(),
                        {
                          hideTime: true,
                        }
                      ),
                      props: {
                        onClick: () => {
                          navigate(
                            getRoute(ROUTES.InvoicesView, {
                              client: clientId,
                              id: quote.id,
                            })
                          );
                        },
                      },
                    },
                    {
                      row: index,
                      column: "quote",
                      label: quote.reference,
                      props: {
                        onClick: () => {
                          navigate(
                            getRoute(ROUTES.InvoicesView, {
                              client: clientId,
                              id: quote.id,
                            })
                          );
                        },
                      },
                    },
                    {
                      row: index,
                      column: "amount",
                      label: formatAmount(quote.total?.total_with_taxes ?? 0),
                      props: {
                        className: "flex justify-end",
                        onClick: () => {
                          navigate(
                            getRoute(ROUTES.InvoicesView, {
                              client: clientId,
                              id: quote.id,
                            })
                          );
                        },
                      },
                    },
                  ],
                };
              }
            )}
            columns={[
              { label: "Livraison le", value: "delivery" },
              { label: "Devis", value: "quote" },
              {
                label: "Montant",
                value: "amount",
                props: { className: "flex justify-end" },
              },
            ]}
          />
          <TableCard
            title="Paiements en retard"
            className="lg:col-span-2"
            tableProps={{
              className: "grid-cols-[1fr_2fr_1fr]",
            }}
            groups={[
              { key: "delay-soon", label: "Bientôt en retard" },
              { key: "delay-30", label: "En retard" },
              { key: "delay-60", label: "30 jours et plus" },
              { key: "delay-90", label: "60 jours et plus" },
              { key: "delay-120", label: "90 jours et plus" },
            ]}
            rows={[
              {
                group: "delay-soon",
                quotes: statistics.almostLatePaymentsNoDelayEntities,
              },
              {
                group: "delay-30",
                quotes: statistics.almostLatePayments30DelayEntities,
              },
              {
                group: "delay-60",
                quotes: statistics.almostLatePayments60DelayEntities,
              },
              {
                group: "delay-90",
                quotes: statistics.almostLatePayments90DelayEntities,
              },
              {
                group: "delay-120",
                quotes: statistics.almostLatePayments120DelayEntities,
              },
            ].flatMap(({ group, quotes }, index) => {
              return quotes.map((quote) => ({
                key: index.toString(),
                group: group,
                items: [
                  {
                    row: index,
                    column: "delivery",

                    label: formatTime(quote.payment_information.computed_date, {
                      hideTime: true,
                    }),
                    props: {
                      onClick: () => {
                        navigate(
                          getRoute(ROUTES.InvoicesView, {
                            client: clientId,
                            id: quote.id,
                          })
                        );
                      },
                    },
                  },
                  {
                    row: index,
                    column: "quote",
                    label: quote.reference,
                    props: {
                      onClick: () => {
                        navigate(
                          getRoute(ROUTES.InvoicesView, {
                            client: clientId,
                            id: quote.id,
                          })
                        );
                      },
                    },
                  },
                  {
                    row: index,
                    column: "amount",
                    label: formatAmount(quote.total?.total_with_taxes ?? 0),
                    props: {
                      className: "flex justify-end",
                      onClick: () => {
                        navigate(
                          getRoute(ROUTES.InvoicesView, {
                            client: clientId,
                            id: quote.id,
                          })
                        );
                      },
                    },
                  },
                ],
              }));
            })}
            columns={[
              { label: "Paiement le", value: "delivery" },
              { label: "Facture", value: "quote" },
              {
                label: "Montant",
                value: "amount",
                props: { className: "flex justify-end" },
              },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 flex-grow gap-[10px]">
          <NumberCard
            title="Devis signés"
            number={statistics.signedQuotes ?? 0}
            totalNumber={statistics.totalSignedQuotes ?? 0}
            icon={(props) => <ClipboardIcon {...props} />}
          />
          <NumberCard
            title="Devis envoyés"
            number={statistics.sentQuotes ?? 0}
            totalNumber={statistics.totalSentQuotes ?? 0}
            icon={(props) => <AtSymbolIcon {...props} />}
          />
          <NumberCard
            title="Factures payées"
            number={statistics.paidInvoices ?? 0}
            totalNumber={statistics.totalPaidInvoices ?? 0}
            icon={(props) => <BanknotesIcon {...props} />}
          />
          <NumberCard
            title="Factures envoyées"
            number={statistics.sentInvoices ?? 0}
            totalNumber={statistics.totalSentInvoices ?? 0}
            icon={(props) => <AtSymbolIcon {...props} />}
          />
          <NumberCard
            title="Entrées stock"
            number={statistics.stockEntries ?? 0}
            totalNumber={statistics.totalStockEntries ?? 0}
            icon={(props) => <ArrowTurnRightDownIcon {...props} />}
          />
          <NumberCard
            title="Sorties stock"
            number={statistics.stockExits ?? 0}
            totalNumber={statistics.totalStockExits ?? 0}
            icon={(props) => <ArrowTurnRightUpIcon {...props} />}
          />
          <NumberCard
            title="Commandes envoyées"
            className="lg:col-span-2"
            number={statistics.sentPurchaseOrders ?? 0}
            totalNumber={statistics.totalSentPurchaseOrders ?? 0}
            icon={(props) => <AtSymbolIcon {...props} />}
          />
        </div>
      </div>
    </Page>
  );
};
