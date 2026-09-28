import { InputLabel } from "@atoms/input/input-decoration-label";
import { Select } from "@atoms/input/input-select";
import { Input } from "@atoms/input/input-text";
import { BaseSmall, Info } from "@atoms/text";
import { useAdminTenants } from "@features/admin/hooks";
import { Tenant } from "@features/admin/types";
import { ROUTES, getRoute } from "@features/routes";
import { Pagination } from "@molecules/table/table";
import { Table } from "@molecules/table";
import { Callout, Heading } from "@radix-ui/themes";
import _ from "lodash";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../_layout/page";
import {
  ActivityStatus,
  LastActivity,
  StatTile,
  SysAdminOnly,
  formatDate,
  getActivityStatus,
} from "./components";

const PER_PAGE = 20;

const SORTS: { [key: string]: (t: Tenant) => string | number } = {
  name: (t) => t.name.toLocaleLowerCase(),
  created_at: (t) => t.created_at || 0,
  members: (t) => t.members,
  documents: (t) => t.activity.total,
  activity: (t) => t.activity.updated_30d,
  last_activity: (t) => t.activity.last_activity_at || 0,
};

const matches = (tenant: Tenant, search: string) => {
  const words = search.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text = [
    tenant.id,
    tenant.name,
    tenant.legal_name,
    tenant.registration_number,
    tenant.city,
    ...tenant.owners.flatMap((o) => [o.full_name, o.email]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  return words.every((word) => text.includes(word));
};

export const AdminTenantsPage = () => {
  return (
    <Page title={[{ label: "Administration" }, { label: "Entreprises" }]}>
      <SysAdminOnly>
        <AdminTenants />
      </SysAdminOnly>
    </Page>
  );
};

const AdminTenants = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useAdminTenants();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [pagination, setPagination] = useState<
    Pick<Pagination, "page" | "perPage" | "orderBy" | "order">
  >({ page: 1, perPage: PER_PAGE, orderBy: "last_activity", order: "DESC" });

  const filtered = useMemo(() => {
    const tenants = (data?.tenants || []).filter(
      (t) =>
        (!search || matches(t, search)) &&
        (!status || getActivityStatus(t).key === status),
    );
    const sort = SORTS[pagination.orderBy || ""] || SORTS.last_activity;
    return _.orderBy(
      tenants,
      [sort],
      [pagination.order === "ASC" ? "asc" : "desc"],
    );
  }, [data, search, status, pagination.orderBy, pagination.order]);

  const summary = data?.summary;

  return (
    <div className="w-full max-w-6xl mx-auto mt-6">
      <Heading size="6">Entreprises</Heading>
      <Info className="mt-2 block">
        Toutes les entreprises de la plateforme et leur activité. L'activité
        correspond aux documents créés ou modifiés (devis, factures, contacts,
        articles, stock, CRM, tâches, comptabilité, commentaires, fichiers), y
        compris les actions automatiques.
      </Info>

      {error && (
        <Callout.Root color="red" className="mt-4">
          <Callout.Text>{(error as Error).message}</Callout.Text>
        </Callout.Root>
      )}

      {summary && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <StatTile
            label="Entreprises"
            value={summary.tenants.toLocaleString()}
          />
          <StatTile
            label="Actives (7 jours)"
            value={summary.active_7d.toLocaleString()}
          />
          <StatTile
            label="Actives (30 jours)"
            value={summary.active_30d.toLocaleString()}
          />
          <StatTile
            label="Nouvelles (30 jours)"
            value={summary.new_30d.toLocaleString()}
          />
          <StatTile
            label="Utilisateurs"
            value={summary.users.toLocaleString()}
          />
          <StatTile
            label="Documents (30 jours)"
            value={summary.documents_updated_30d.toLocaleString()}
            hint="créés ou modifiés"
          />
        </div>
      )}

      <div className="mt-6 mb-4 flex flex-wrap items-end gap-2">
        <InputLabel
          className="grow max-w-md"
          label="Rechercher"
          input={
            <Input
              placeholder="Nom, raison sociale, SIREN, e-mail d'un administrateur..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
          }
        />
        <InputLabel
          label="Activité"
          input={
            <Select
              className="w-auto"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <option value="">Toutes</option>
              <option value="active">Actives (moins de 7 jours)</option>
              <option value="recent">Peu actives (7 à 30 jours)</option>
              <option value="inactive">Inactives (plus de 30 jours)</option>
              <option value="never">Jamais utilisées</option>
            </Select>
          }
        />
      </div>

      <Table
        key={search + status}
        rowIndex="id"
        data={filtered.slice(
          (pagination.page - 1) * pagination.perPage,
          pagination.page * pagination.perPage,
        )}
        loading={isLoading}
        showPagination="full"
        total={filtered.length}
        initialPagination={{
          page: pagination.page,
          perPage: pagination.perPage,
          orderBy: pagination.orderBy,
          order: pagination.order,
        }}
        onRequestData={async ({ page, perPage, orderBy, order }) =>
          setPagination({ page, perPage, orderBy, order })
        }
        onClick={(tenant) =>
          navigate(getRoute(ROUTES.AdminTenantsView, { id: tenant.id }))
        }
        columns={[
          {
            title: "Entreprise",
            orderBy: "name",
            render: (tenant) => (
              <div className="flex flex-col">
                <span className="font-medium">{tenant.name}</span>
                <BaseSmall className="text-gray-500">
                  {[tenant.legal_name, tenant.registration_number, tenant.city]
                    .filter(Boolean)
                    .join(" · ") || tenant.id}
                </BaseSmall>
              </div>
            ),
          },
          {
            title: "Administrateurs",
            render: (tenant) => (
              <BaseSmall className="break-all">
                {tenant.owners
                  .map((o) => o.email || o.full_name || o.user_id)
                  .join(", ") || "-"}
              </BaseSmall>
            ),
          },
          {
            title: "Créée le",
            orderBy: "created_at",
            render: (tenant) => formatDate(tenant.created_at),
          },
          {
            title: "Membres",
            orderBy: "members",
            render: (tenant) => (
              <span className="tabular-nums">
                {tenant.members}
                {tenant.invitations > 0 && (
                  <BaseSmall className="text-gray-500">
                    {" "}
                    (+{tenant.invitations} invitation
                    {tenant.invitations > 1 ? "s" : ""})
                  </BaseSmall>
                )}
              </span>
            ),
          },
          {
            title: "Documents",
            orderBy: "documents",
            render: (tenant) => (
              <span className="tabular-nums">
                {tenant.activity.total.toLocaleString()}
              </span>
            ),
          },
          {
            title: "Activité 30 j",
            orderBy: "activity",
            render: (tenant) => (
              <span className="tabular-nums">
                {tenant.activity.updated_30d.toLocaleString()}
                <BaseSmall className="text-gray-500">
                  {" "}
                  ({tenant.activity.updated_7d.toLocaleString()} sur 7 j)
                </BaseSmall>
              </span>
            ),
          },
          {
            title: "Dernière activité",
            orderBy: "last_activity",
            render: (tenant) => (
              <div className="flex flex-col items-start gap-1">
                <ActivityStatus tenant={tenant} />
                <BaseSmall>
                  <LastActivity value={tenant.activity.last_activity_at} />
                </BaseSmall>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
