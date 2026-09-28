import { Button } from "@atoms/button/button";
import InputCopiable from "@atoms/input/input-copiable";
import { BaseSmall, Info } from "@atoms/text";
import { Tooltip } from "@atoms/tooltip";
import { useAdminTenant } from "@features/admin/hooks";
import { INVOICE_TYPE_LABELS, TABLE_LABELS } from "@features/admin/labels";
import { TenantDetails } from "@features/admin/types";
import { ROUTES, getRoute } from "@features/routes";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Table } from "@molecules/table";
import { Badge, Callout, Heading } from "@radix-ui/themes";
import { useParams } from "react-router-dom";
import { Page } from "../_layout/page";
import {
  ActivityStatus,
  LastActivity,
  StatTile,
  SysAdminOnly,
  formatDate,
} from "./components";

export const AdminTenantPage = () => {
  const { id } = useParams();
  const { data } = useAdminTenant(id || "");
  return (
    <Page
      title={[
        { label: "Administration" },
        { label: "Entreprises", to: getRoute(ROUTES.AdminTenants) },
        { label: data?.tenant.name || id },
      ]}
    >
      <SysAdminOnly>
        <AdminTenant id={id || ""} />
      </SysAdminOnly>
    </Page>
  );
};

const AdminTenant = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useAdminTenant(id);

  if (error) {
    return (
      <Callout.Root color="red" className="mt-6 max-w-6xl mx-auto">
        <Callout.Text>{(error as Error).message}</Callout.Text>
      </Callout.Root>
    );
  }
  if (isLoading || !data)
    return <Info className="block mt-6">Chargement...</Info>;

  const { tenant } = data;

  return (
    <div className="w-full max-w-6xl mx-auto mt-6 space-y-8">
      <div>
        <Button
          size="sm"
          theme="invisible"
          icon={(p) => <ArrowLeftIcon {...p} />}
          to={getRoute(ROUTES.AdminTenants)}
        >
          Toutes les entreprises
        </Button>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Heading size="6">{tenant.name}</Heading>
          <ActivityStatus tenant={tenant} />
          {tenant.plan && <Badge color="gray">{tenant.plan}</Badge>}
        </div>
        <Info className="block mt-1">
          {[
            tenant.legal_name,
            tenant.registration_number,
            [tenant.city, tenant.country].filter(Boolean).join(", "),
            `créée le ${formatDate(tenant.created_at)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Info>
        <div className="mt-3 max-w-sm">
          <InputCopiable readOnly value={tenant.id} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <StatTile
          label="Membres"
          value={tenant.members}
          hint={
            tenant.invitations
              ? `+${tenant.invitations} invitation${tenant.invitations > 1 ? "s" : ""} en attente`
              : undefined
          }
        />
        <StatTile
          label="Documents"
          value={tenant.activity.total.toLocaleString()}
        />
        <StatTile
          label="Activité (7 jours)"
          value={tenant.activity.updated_7d.toLocaleString()}
          hint="créés ou modifiés"
        />
        <StatTile
          label="Activité (30 jours)"
          value={tenant.activity.updated_30d.toLocaleString()}
          hint={`dont ${tenant.activity.created_30d.toLocaleString()} créés`}
        />
        <StatTile
          label="Dernière activité"
          value={<LastActivity value={tenant.activity.last_activity_at} />}
        />
      </div>

      <CreatedPerDay data={data} />

      <div>
        <Heading size="4" className="mb-2">
          Membres
        </Heading>
        <Table
          rowIndex="user_id"
          data={data.members}
          columns={[
            {
              title: "Utilisateur",
              render: (member) => (
                <div className="flex flex-col">
                  <span className="font-medium">
                    {member.full_name || member.email || member.user_id}
                  </span>
                  {member.full_name && (
                    <BaseSmall className="text-gray-500">
                      {member.email}
                    </BaseSmall>
                  )}
                </div>
              ),
            },
            {
              title: "Rôle",
              render: (member) =>
                member.invitation ? (
                  <Badge color="gray">Invitation en attente</Badge>
                ) : member.roles.includes("CLIENT_MANAGE") ? (
                  <Badge color="blue">Administrateur</Badge>
                ) : (
                  <BaseSmall>
                    {member.roles.length} permission
                    {member.roles.length > 1 ? "s" : ""}
                  </BaseSmall>
                ),
            },
            {
              title: "Ajouté le",
              render: (member) => formatDate(member.created_at),
            },
            {
              title: "Activité 30 j",
              render: (member) => (
                <span className="tabular-nums">
                  {member.updated_30d.toLocaleString()}
                </span>
              ),
            },
            {
              title: "Dernière activité",
              render: (member) => (
                <LastActivity value={member.last_activity_at} />
              ),
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Heading size="4" className="mb-2">
            Utilisation par module
          </Heading>
          <Table
            rowIndex="table"
            data={data.tables}
            columns={[
              {
                title: "Module",
                render: (row) => TABLE_LABELS[row.table] || row.table,
              },
              {
                title: "Documents",
                render: (row) => (
                  <span className="tabular-nums">
                    {row.total.toLocaleString()}
                  </span>
                ),
              },
              {
                title: "Créés 30 j",
                render: (row) => (
                  <span className="tabular-nums">
                    {row.created_30d.toLocaleString()}
                  </span>
                ),
              },
              {
                title: "Modifiés 30 j",
                render: (row) => (
                  <span className="tabular-nums">
                    {row.updated_30d.toLocaleString()}
                  </span>
                ),
              },
              {
                title: "Dernière activité",
                render: (row) => <LastActivity value={row.last_activity_at} />,
              },
            ]}
          />
        </div>
        <div>
          <Heading size="4" className="mb-2">
            Documents commerciaux
          </Heading>
          {data.invoices_by_type.length ? (
            <div className="space-y-1">
              {data.invoices_by_type.map((row) => (
                <div
                  key={row.type}
                  className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1"
                >
                  <BaseSmall>
                    {INVOICE_TYPE_LABELS[row.type] || row.type}
                  </BaseSmall>
                  <BaseSmall className="tabular-nums font-medium">
                    {row.count.toLocaleString()}
                  </BaseSmall>
                </div>
              ))}
            </div>
          ) : (
            <Info>Aucun document</Info>
          )}
        </div>
      </div>
    </div>
  );
};

// Documents created per day, one bar per day (days without documents included)
const CreatedPerDay = ({ data }: { data: TenantDetails }) => {
  const byDay = new Map(data.per_day.map((d) => [d.day, d.count]));
  const days = Array.from({ length: data.days }, (_, i) => {
    const date = new Date(Date.now() - (data.days - 1 - i) * 86400000);
    const day = date.toISOString().slice(0, 10);
    return { day, count: byDay.get(day) || 0 };
  });
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const max = Math.max(1, ...days.map((d) => d.count));
  const label = (day: string) =>
    new Date(day + "T12:00:00Z").toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });

  return (
    <div>
      <Heading size="4" className="mb-2">
        Documents créés par jour
      </Heading>
      <div
        className="flex items-end gap-px h-28 border-b border-slate-200 dark:border-slate-700"
        role="img"
        aria-label={`Documents créés par jour sur ${data.days} jours, ${total} au total`}
      >
        {days.map((d) => (
          <Tooltip
            key={d.day}
            content={
              <>
                <b>{label(d.day)}</b> · {d.count} document
                {d.count > 1 ? "s" : ""}
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
          {total.toLocaleString()} document{total > 1 ? "s" : ""} sur{" "}
          {data.days} jours
        </BaseSmall>
        <BaseSmall className="text-gray-500">
          {label(days[days.length - 1].day)}
        </BaseSmall>
      </div>
    </div>
  );
};
