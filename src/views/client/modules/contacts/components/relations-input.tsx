import { Button } from "@atoms/button/button";
import { Info, SectionSmall } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { RestDocumentsInput } from "@components/input-rest";
import { ContactsColumns } from "@features/contacts/configuration";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { CtrlKRestEntities } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Table } from "@molecules/table";
import _ from "lodash";
import { useEffect } from "react";

export const RelationsInput = ({
  id,
  readonly,
  value,
  onChange,
}: {
  id: string;
  readonly?: boolean;
  value: [string[], Contacts["parents_roles"]]; // parents, parents_roles
  onChange: (parents: string[], roles: Contacts["parents_roles"]) => void;
}) => {
  const navigate = useNavigateAlt();
  const { contacts: children } = useContacts({
    query: [
      {
        key: "parents",
        values: [{ op: "equals", value: id }],
      },
    ],
    key: "children_" + id,
  });

  const { contacts: parents, refresh } = useContacts({
    query: [
      {
        key: "id",
        values: value[0].map((id) => ({ op: "equals", value: id })),
      },
    ],
    key: "parents_" + id,
    limit: value[0].length,
  });

  useEffect(() => {
    refresh();
  }, [id]);

  return (
    <div className="space-y-4">
      <div>
        {!!parents?.data?.list?.length && readonly && (
          <SectionSmall>Parents</SectionSmall>
        )}
        <Info>
          Les contacts parents sont les contacts qui sont responsables,
          employeurs ou encore sociétés de ce contact.
        </Info>
        {(!!parents.data?.list?.length || !readonly) && (
          <div className="space-y-4 mt-2">
            {!readonly &&
              (parents?.data?.list || []).map((contact) => (
                <div className="rounded border p-4" key={contact.id}>
                  <Button
                    icon={(p) => <TrashIcon {...p} />}
                    size="md"
                    theme="danger"
                    className="float-right"
                    onClick={() => {
                      const details = { ...value[1] };
                      delete details[contact.id];
                      onChange(
                        value[0].filter((id) => id !== contact.id),
                        details
                      );
                    }}
                  />
                  <SectionSmall>{getContactName(contact)}</SectionSmall>
                  <FormInput
                    label="Rôle"
                    type="text"
                    value={value[1][contact.id]?.role || ""}
                    onChange={(role: string) => {
                      onChange(value[0], {
                        ...value[1],
                        [contact.id]: {
                          role,
                        },
                      });
                    }}
                    placeholder="Rôle"
                  />
                </div>
              ))}
            {!readonly && (
              <div className="mt-2">
                <RestDocumentsInput
                  entity="contacts"
                  size="xl"
                  label="+ Attacher à un contact parent"
                  placeholder="Attacher le contact parent et choisir un rôle"
                  value={""}
                  onChange={(parent) => {
                    if (parent && typeof parent === "string") {
                      onChange(_.uniq([...value[0], parent]), {
                        ...value[1],
                        [parent]: {
                          role: "",
                        },
                      });
                    }
                  }}
                />
              </div>
            )}

            {!!parents?.data?.list?.length && readonly && (
              <>
                <Table
                  data={parents.data?.list || []}
                  columns={[
                    ...ContactsColumns,
                    {
                      title: "Rôle",
                      render: (contact) => <>{value[1][contact.id]?.role}</>,
                    },
                  ]}
                  onClick={(contact, event) =>
                    navigate(
                      getRoute(ROUTES.ContactsView, { id: contact.id }),
                      {
                        event,
                      }
                    )
                  }
                />
              </>
            )}
          </div>
        )}
      </div>

      {!!children?.data?.total && readonly && (
        <div>
          <SectionSmall>Contacts liés</SectionSmall>
          <Table
            data={children.data?.list || []}
            columns={[
              ...ContactsColumns,
              {
                title: "Rôle",
                render: (contact) => <>{contact.parents_roles[id]?.role}</>,
              },
            ]}
            onClick={(contact, event) =>
              navigate(getRoute(ROUTES.ContactsView, { id: contact.id }), {
                event,
              })
            }
          />
        </div>
      )}
    </div>
  );
};
