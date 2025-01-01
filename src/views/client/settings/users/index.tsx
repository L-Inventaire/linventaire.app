import Avatar from "@atoms/avatar/avatar";
import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { InputLabel } from "@atoms/input/input-decoration-label";
import SelectMultiple from "@atoms/input/input-select-multiple";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { BaseSmall, Info, Section } from "@atoms/text";
import { useHasAccess } from "@features/access";
import { useAuth } from "@features/auth/state/use-auth";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useClients } from "@features/clients/state/use-clients";
import { ClientsUsers, Role, Roles } from "@features/clients/types/clients";
import { PublicCustomer } from "@features/customers/types/customers";
import {
  getEmailsFromString,
  getServerUri,
} from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import _ from "lodash";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Page, PageBlock } from "../../_layout/page";

export const CompanyUsersPage = () => {
  const { user: me } = useAuth();
  const { client, inviteUsers, loading } = useClients();
  const hasAccess = useHasAccess();
  const readonly = !hasAccess("USERS_WRITE");

  const { users, refresh, remove, update } = useClientUsers(client!.client_id);

  const [invitees, setInvitees] = useState("");
  const [inviteesRoles, setInviteesRoles] = useState<string[]>([]);
  const invitedEmails = getEmailsFromString(invitees);

  const [updatingUsers, setUpdatingUsers] = useState<string[]>([]);
  const [updatingRoles, setUpdatingRoles] = useState<string[]>([]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (updatingUsers.length) {
      const selectedUsers = updatingUsers.map((id) =>
        users.find((u) => u.user_id === id)
      );
      const roles = _.uniq(
        _.flatMap(selectedUsers.map((u: any) => u.roles.list))
      );
      setUpdatingRoles(roles);
    }
  }, [updatingUsers.length]);

  if (!users) return <></>;

  const manageableRoles = (a: { value: string }) =>
    a.value.includes("CLIENT_MANAGE") ||
    a.value.includes("CONTACTS") ||
    a.value.includes("ARTICLES") ||
    a.value.includes("STOCK") ||
    a.value.includes("INVOICES") ||
    a.value.includes("CRM") ||
    a.value.includes("QUOTES") ||
    a.value.includes("ONSITE_SERVICES");

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Vos Collaborateurs" }]}>
      <Modal
        open={updatingUsers.length > 0}
        onClose={() => setUpdatingUsers([])}
      >
        <ModalContent title="Modifier des utilisateurs">
          <SelectMultiple
            disabled={loading}
            className="grow"
            placeholder="Rôles"
            value={updatingRoles}
            onChange={(e) => setUpdatingRoles(e)}
            options={getRoles().filter(manageableRoles)}
          />
          <Button
            className="mt-4"
            loading={loading}
            onClick={async () => {
              const roles = updatingRoles as Role[];
              for (const user of updatingUsers) {
                const u = users.find((u) => u.user_id === user);
                if (u) {
                  await update({ id: user, roles });
                }
              }
              setUpdatingUsers([]);
            }}
          >
            Appliquer à {updatingUsers.length} utilisateur(s)
          </Button>
          <Info className="block mt-4">
            Chaque module possède 3 niveaux de permissions READ, WRITE et
            MANAGE:
            <br />
            <br />
            <b>- READ</b>: Voir les données uniquement.
            <br />
            <b>- WRITE</b>: Modifier les données excepté les actions de masse et
            paramètrages.
            <br />
            <b>- MANAGE</b>: Niveau le plus élevé.
            <br />
            <br />
            Un niveau de permission inclut les niveaux inférieurs. Par exemple,
            WRITE inclut READ.
          </Info>
        </ModalContent>
      </Modal>

      <PageBlock>
        <Section>Inviter un collaborateur</Section>
        <InputLabel
          className="max-w-xl"
          label="Emails"
          input={
            <div className="flex-col flex space-y-2">
              <Input
                placeholder="Jeff <jeff@books.com>, romaric@books.com"
                disabled={loading}
                value={invitees}
                onChange={(e) => setInvitees(e.target.value)}
              />
              <div className="flex-row flex space-x-2 grow w-full">
                <SelectMultiple
                  className="grow"
                  placeholder="Rôles"
                  value={inviteesRoles}
                  onChange={(e) => setInviteesRoles(e)}
                  options={getRoles().filter(manageableRoles)}
                />
                <Button
                  disabled={!invitedEmails.length}
                  loading={loading}
                  className="shrink-0"
                  onClick={async () => {
                    try {
                      await inviteUsers(
                        client!.client_id,
                        invitedEmails,
                        inviteesRoles as Role[]
                      );
                      setInvitees("");
                      refresh();
                      toast.success("Invitations envoyées");
                    } catch (e) {
                      console.error(e);
                      toast.error("Erreur lors de l'envoi des invitations");
                    }
                  }}
                >
                  Inviter {invitedEmails.length} utilisateurs
                </Button>
              </div>
            </div>
          }
        />
      </PageBlock>

      {!!users.filter((u) => !(u.user as any).id).length && (
        <PageBlock>
          <Section>Invitations en attente</Section>
          <Info className="block mb-3">
            Ces utilisateurs doivent créer un compte en utilisant l'email défini
            ci-dessous.
          </Info>
          <Table
            rowIndex="user_id"
            onSelect={
              readonly
                ? undefined
                : [
                    {
                      label: "Changer les rôles",
                      callback: (users) => {
                        setUpdatingUsers(users.map((u) => u.user_id));
                      },
                    },
                    {
                      label: "Retirer",
                      type: "danger",
                      callback: async (users) => {
                        for (const user of users) {
                          await remove(user.user_id);
                        }
                      },
                    },
                  ]
            }
            data={_.sortBy(
              users.filter((u) => !(u.user as any).id) as (ClientsUsers & {
                user: { email: string };
              })[],
              (a) => a.user.email
            )}
            columns={[
              {
                title: "Email",
                render: (user) => user.user.email,
              },
              {
                title: "Roles",
                render: (user) => (
                  <BaseSmall>{roleSumary(user.roles.list)}</BaseSmall>
                ),
              },
              {
                title: "Actions",
                hidden: readonly,
                thClassName: "w-1",
                render: (user) => (
                  <>
                    <Button
                      loading={loading}
                      onClick={() => {
                        remove(user.user.email);
                      }}
                      size="md"
                      theme="danger"
                    >
                      Retirer
                    </Button>
                  </>
                ),
              },
            ]}
          />
        </PageBlock>
      )}

      <PageBlock>
        <Section>Vos collaborateur</Section>
        <Table
          data={_.sortBy(
            users.filter((u) => (u.user as any).id) as (ClientsUsers & {
              user: PublicCustomer;
            })[],
            (a) => a.user.full_name + a.user.email
          )}
          rowIndex="user_id"
          onSelect={
            readonly
              ? undefined
              : [
                  {
                    label: "Changer les rôles",
                    callback: () => {
                      setUpdatingUsers(users.map((u) => u.user_id));
                    },
                  },
                ]
          }
          columns={[
            {
              title: "Utilisateur",
              render: (user) => (
                <>
                  <Avatar
                    avatar={getServerUri(user.user?.avatar) || ""}
                    fallback={user.user.full_name}
                    size={5}
                    className="mr-2 shrink-0"
                  />
                  {user.user.full_name}
                </>
              ),
            },
            {
              title: "Email",
              render: (user) => user.user.email,
            },
            {
              title: "Roles",
              render: (user) => (
                <BaseSmall>{roleSumary(user.roles.list)}</BaseSmall>
              ),
            },
            {
              title: "Actions",
              thClassName: "w-20",
              hidden: readonly,
              render: (user) =>
                user.user.id === me?.id ? (
                  <Info>It's you</Info>
                ) : (
                  <>
                    <Button
                      size="md"
                      className="mr-2"
                      onClick={() => setUpdatingUsers([user.user_id])}
                    >
                      Modifier
                    </Button>
                    <ButtonConfirm
                      loading={loading}
                      onClick={() => {
                        remove(user.user.id);
                      }}
                      size="md"
                      theme="danger"
                    >
                      Retirer
                    </ButtonConfirm>
                  </>
                ),
            },
          ]}
        />
      </PageBlock>
    </Page>
  );
};

const roleSumary = (roles: Role[]) => {
  // Role is in this format: CLIENT_MANAGE, USERS_READ, etc
  // Return in format Manage: a, b, c - Write: d, e, f - Read: g, h, i

  // First remove write and read if manage exists, and read if write exists
  roles = (roles || []).filter((role) => {
    const value = role.match(/^(.*)_([A-Z]+)$/)?.[1];
    const level = role.match(/^(.*)_([A-Z]+)$/)?.[2];
    if (level === "READ") {
      return (
        !roles.includes(`${value}_WRITE` as any) &&
        !roles.includes(`${value}_MANAGE` as any)
      );
    }
    if (level === "WRITE") {
      return !roles.includes(`${value}_MANAGE` as any);
    }
    return true;
  });

  const rolesByType = roles.reduce((acc, role) => {
    const value = role.match(/^(.*)_([A-Z]+)$/)?.[1];
    const type = role.match(/^(.*)_([A-Z]+)$/)?.[2] as any;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(RolesNames[value as any] || value);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <>
      {["READ", "WRITE", "MANAGE"].map(
        (level) =>
          rolesByType[level] &&
          rolesByType[level].length > 0 && (
            <div key={level}>
              <b>{RolesNames[level]}</b>: {rolesByType[level].join(", ")}
            </div>
          )
      )}
    </>
  );
};

const RolesNames: any = {
  CLIENT: "(toute l'entreprise)",
  CLIENT_MANAGE: "Administrateur",
  CONTACTS: "Contacts",
  ARTICLES: "Articles",
  STOCK: "Stock et réceptions",
  INVOICES: "Factures et avoirs",
  QUOTES: "Devis",
  SUPPLIER_INVOICES: "Factures fournisseurs",
  SUPPLIER_QUOTES: "Devis fournisseurs",
  ONSITE_SERVICES: "Service",
  CRM: "CRM",
  MANAGE: "Administration",
  WRITE: "Lecture et modifications",
  READ: "Lecture",
};

const getRoles = () =>
  _.flatMap(
    Roles.map((level) => ({
      value: level,
      label:
        RolesNames[level] ||
        (RolesNames[level.split(/_[A-Z]+$/)[0]]
          ? RolesNames[level.split(/_[A-Z]+$/)[0]] +
            ` (${RolesNames[level.split(/_([A-Z]+)$/)[1]]})`
          : level),
    }))
  );
