import { Checkbox } from "@atoms/input/input-checkbox";
import { Select } from "@atoms/input/input-select";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { BaseSmall, Info } from "@atoms/text";
import { Tooltip } from "@atoms/tooltip";
import { useHasAccess } from "@features/access";
import { ApiCallsFilters } from "@features/developers/api-client/developers-api-client";
import {
  useApiCall,
  useApiCalls,
  useApiCallsStats,
} from "@features/developers/hooks/use-api-calls";
import { useApiKeys } from "@features/developers/hooks/use-api-keys";
import { ApiCallsStats } from "@features/developers/types/types";
import { Table } from "@molecules/table";
import { Heading } from "@radix-ui/themes";
import { useState } from "react";
import {
  CodeBlock,
  formatDate,
  formatSize,
  HttpStatus,
  useUserName,
} from "./utils";

const PER_PAGE = 20;

export const ApiCallsTab = ({ clientId }: { clientId: string }) => {
  const hasAccess = useHasAccess();
  const isManager = hasAccess("CLIENT_MANAGE");
  const userName = useUserName(clientId);

  const [filters, setFilters] = useState<ApiCallsFilters>({
    all: false,
    api_key_id: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<string | null>(null);

  const { keys } = useApiKeys(clientId, { all: !!filters.all });
  const { data: stats } = useApiCallsStats(clientId, filters);
  const { data: calls, isLoading } = useApiCalls(clientId, {
    ...filters,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  const keyName = (id: string) => keys.find((k) => k.id === id)?.name || id;
  const setFilter = (changes: Partial<ApiCallsFilters>) => {
    setFilters({ ...filters, ...changes });
    setPage(1);
  };

  return (
    <>
      <ApiCallModal
        clientId={clientId}
        callId={opened}
        keyName={keyName}
        onClose={() => setOpened(null)}
      />

      <Heading size="4" className="mb-2">
        Historique des appels
      </Heading>
      <Info className="block mb-4">
        Les appels faits avec vos clés API sont conservés 30 jours, avec le
        début des contenus envoyés et reçus pour vous aider à déboguer vos
        intégrations.
      </Info>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select
          className="w-auto"
          value={filters.api_key_id}
          onChange={(e) => setFilter({ api_key_id: e.target.value })}
        >
          <option value="">Toutes les clés</option>
          {keys.map((key) => (
            <option key={key.id} value={key.id}>
              {key.name}
              {filters.all ? ` (${userName(key.user_id)})` : ""}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={filters.status}
          onChange={(e) => setFilter({ status: e.target.value as any })}
        >
          <option value="">Tous les statuts</option>
          <option value="success">Réussis</option>
          <option value="error">En erreur</option>
        </Select>
        {isManager && (
          <Checkbox
            label="Toutes les clés de l'entreprise"
            value={!!filters.all}
            onChange={(all) => setFilter({ all, api_key_id: "" })}
          />
        )}
      </div>

      {stats && <StatsSummary stats={stats} />}

      <Table
        key={JSON.stringify(filters)}
        rowIndex="id"
        data={calls?.list || []}
        loading={isLoading}
        onClick={(call) => setOpened(call.id)}
        showPagination="simple"
        total={calls?.total || 0}
        initialPagination={{ page: 1, perPage: PER_PAGE }}
        onRequestData={async ({ page }) => setPage(page)}
        columns={[
          {
            title: "Date",
            render: (call) => formatDate(call.created_at),
          },
          {
            title: "Requête",
            render: (call) => (
              <code className="text-sm break-all">
                <span className="font-semibold">{call.method}</span> {call.url}
              </code>
            ),
          },
          {
            title: "Statut",
            render: (call) => <HttpStatus status={call.status} />,
          },
          {
            title: "Durée",
            render: (call) => `${call.duration_ms} ms`,
          },
          {
            title: "Clé",
            render: (call) => <BaseSmall>{keyName(call.api_key_id)}</BaseSmall>,
          },
        ]}
      />
    </>
  );
};

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-slate-200 dark:border-slate-700 rounded-md px-4 py-3">
    <BaseSmall className="block text-gray-500">{label}</BaseSmall>
    <div className="text-xl font-semibold tabular-nums">{value}</div>
  </div>
);

// Calls per day over the last days, one bar per day (days without calls included)
const StatsSummary = ({ stats }: { stats: ApiCallsStats }) => {
  const byDay = new Map(stats.per_day.map((d) => [d.day, d]));
  const days = Array.from({ length: stats.days }, (_, i) => {
    const date = new Date(Date.now() - (stats.days - 1 - i) * 86400000);
    const day = date.toISOString().slice(0, 10);
    return byDay.get(day) || { day, count: 0, errors: 0, avg_duration_ms: 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  const label = (day: string) =>
    new Date(day + "T12:00:00Z").toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <StatTile
          label={`Appels (${stats.days} jours)`}
          value={stats.total.toLocaleString()}
        />
        <StatTile
          label="Taux d'erreur"
          value={`${(stats.error_rate * 100).toFixed(1)} %`}
        />
        <StatTile label="Durée moyenne" value={`${stats.avg_duration_ms} ms`} />
      </div>
      <BaseSmall className="block text-gray-500 mb-1">
        Appels par jour
      </BaseSmall>
      <div
        className="flex items-end gap-0.5 h-24 border-b border-slate-200 dark:border-slate-700"
        role="img"
        aria-label={`Appels par jour sur ${stats.days} jours, ${stats.total} au total`}
      >
        {days.map((d) => (
          <Tooltip
            key={d.day}
            content={
              <>
                <b>{label(d.day)}</b> · {d.count} appel{d.count > 1 ? "s" : ""}
                {d.count > 0 &&
                  ` · ${d.errors} erreur${d.errors > 1 ? "s" : ""} · ${d.avg_duration_ms} ms en moyenne`}
              </>
            }
          >
            {/* The hit target is the full column height, not only the bar */}
            <div className="flex-1 h-full flex items-end group">
              <div
                className="w-full rounded-t bg-blue-500 group-hover:bg-blue-600 dark:bg-blue-400 dark:group-hover:bg-blue-300"
                style={{
                  height: d.count
                    ? `${Math.max(3, (d.count / max) * 100)}%`
                    : 0,
                }}
              />
            </div>
          </Tooltip>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <BaseSmall className="text-gray-500">{label(days[0].day)}</BaseSmall>
        <BaseSmall className="text-gray-500">
          {label(days[days.length - 1].day)}
        </BaseSmall>
      </div>
    </div>
  );
};

const ApiCallModal = ({
  clientId,
  callId,
  keyName,
  onClose,
}: {
  clientId: string;
  callId: string | null;
  keyName: (id: string) => string;
  onClose: () => void;
}) => {
  const { data: call } = useApiCall(clientId, callId);
  return (
    <Modal open={!!callId} onClose={onClose} className="sm:!max-w-3xl">
      <ModalContent title="Détail de l'appel">
        {call && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-sm break-all">
                <span className="font-semibold">{call.method}</span> {call.url}
              </code>
              <HttpStatus status={call.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                ["Date", formatDate(call.created_at)],
                ["Durée", `${call.duration_ms} ms`],
                ["Clé", keyName(call.api_key_id)],
                ["Adresse IP", call.ip || "-"],
                ["Identifiant de requête", call.req_id],
                ["User-Agent", call.user_agent || "-"],
              ].map(([label, value]) => (
                <BaseSmall key={label} className="break-all">
                  <span className="text-gray-500">{label} :</span> {value}
                </BaseSmall>
              ))}
            </div>
            <div>
              <BaseSmall className="font-medium block mb-1">
                Requête ({formatSize(call.request_size)})
              </BaseSmall>
              <CodeBlock value={call.request_body} />
            </div>
            <div>
              <BaseSmall className="font-medium block mb-1">
                Réponse ({formatSize(call.response_size)})
              </BaseSmall>
              <CodeBlock value={call.response_body} />
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};
