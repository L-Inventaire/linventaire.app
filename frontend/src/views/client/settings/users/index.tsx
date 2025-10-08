import Avatar from "@atoms/avatar/avatar";
import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { BaseSmall, Info } from "@atoms/text";
import { RoleMatrix } from "@components/role-matrix/role-matrix";
import { RoleComparison } from "@components/role-matrix/role-comparison";
import { useHasAccess } from "@features/access";
import { useAuth } from "@features/auth/state/use-auth";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useClients } from "@features/clients/state/use-clients";
import { ClientsUsers, Role } from "@features/clients/types/clients";
import { PublicCustomer } from "@features/customers/types/customers";
import {
  getEmailsFromString,
  getServerUri,
} from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import { Heading } from "@radix-ui/themes";
import _ from "lodash";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Page } from "../../_layout/page";

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

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Vos Collaborateurs" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Modal
          open={updatingUsers.length > 0}
          onClose={() => setUpdatingUsers([])}
        >
          <ModalContent
            title={`Modifier ${
              updatingUsers.length > 1
                ? `${updatingUsers.length} utilisateurs`
                : "un utilisateur"
            }`}
          >
            <div className="space-y-6">
              {updatingUsers.length > 1 && (
                <RoleComparison
                  users={updatingUsers
                    .map((userId) => users.find((u) => u.user_id === userId)!)
                    .filter(Boolean)}
                />
              )}

              <div>
                <BaseSmall className="font-medium mb-3">
                  {updatingUsers.length > 1
                    ? "Nouvelles permissions à appliquer"
                    : "Permissions"}
                </BaseSmall>
                <RoleMatrix
                  value={updatingRoles as Role[]}
                  onChange={(roles) => setUpdatingRoles(roles)}
                  disabled={loading}
                />
              </div>

              <Button
                className="w-full"
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
                Appliquer à {updatingUsers.length} utilisateur
                {updatingUsers.length > 1 ? "s" : ""}
              </Button>
            </div>
          </ModalContent>
        </Modal>

        <Heading size="6" className="mb-4">
          Inviter un collaborateur
        </Heading>
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
              <div className="space-y-4">
                <RoleMatrix
                  value={inviteesRoles as Role[]}
                  onChange={(roles) => setInviteesRoles(roles)}
                  disabled={loading}
                />
                <Button
                  disabled={!invitedEmails.length || !inviteesRoles.length}
                  loading={loading}
                  className="w-full"
                  onClick={async () => {
                    try {
                      await inviteUsers(
                        client!.client_id,
                        invitedEmails,
                        inviteesRoles as Role[]
                      );
                      setInvitees("");
                      setInviteesRoles([]);
                      refresh();
                      toast.success("Invitations envoyées");
                    } catch (e) {
                      console.error(e);
                      toast.error("Erreur lors de l'envoi des invitations");
                    }
                  }}
                >
                  Inviter {invitedEmails.length} utilisateur
                  {invitedEmails.length > 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          }
        />

        {!!users.filter((u) => !(u.user as any).id).length && (
          <div className="mt-8">
            <Heading size="6">Invitations en attente</Heading>
            <Info className="block mb-3">
              Ces utilisateurs doivent créer un compte en utilisant l'email
              défini ci-dessous.
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
          </div>
        )}

        <Heading size="6" className="mt-8 mb-4">
          Vos collaborateur
        </Heading>
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
                      size="sm"
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
                      size="sm"
                      theme="danger"
                    >
                      Retirer
                    </ButtonConfirm>
                  </>
                ),
            },
          ]}
          border
        />
      </div>
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
