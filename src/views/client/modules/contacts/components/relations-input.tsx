import { Button } from "@atoms/button/button";
import { ContactsColumns } from "@features/contacts/configuration";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { PencilIcon } from "@heroicons/react/24/outline";
import { Table } from "@molecules/table";
import { PageBlock } from "@views/client/_layout/page";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { ContactRelationModalAtom } from "./relations-modal";
import _ from "lodash";
import { EditorInput } from "@molecules/editor-input";

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

  const { contacts: relations, refresh } = useContacts({
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

  const openRelationsModal = useSetRecoilState(ContactRelationModalAtom);

  return (
    <PageBlock
      closable
      title="Relations"
      actions={
        <>
          {!readonly && (
            <Button
              size="sm"
              onClick={() =>
                openRelationsModal({
                  open: true,
                  contact: {
                    parents: value[0],
                    parents_roles: value[1],
                  },
                  relationId: "",
                  onRelationChange: (contactId, relation) => {
                    if (relation) {
                      onChange([...value[0], contactId], {
                        ...value[1],
                        [contactId]: relation,
                      });
                    }
                  },
                })
              }
            >
              Ajouter une relation
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 mt-4">
        <Table
          data={relations?.data?.list || []}
          columns={[
            ...ContactsColumns.filter(
              (a) => a.id !== "tags" && a.id !== "relations"
            ),
            {
              title: "Rôle",
              thClassName: "w-1/4",
              render: (contact) => <>{value[1][contact.id]?.role || "-"}</>,
            },
            {
              title: "Notes",
              thClassName: "w-1/4",
              render: (contact) => (
                <EditorInput
                  value={value[1][contact.id]?.notes || "-"}
                  disabled={true}
                />
              ),
            },
            ...(!readonly
              ? [
                  {
                    thClassName: "w-1",
                    render: (contact: Contacts) => (
                      <>
                        <Button
                          theme="outlined"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openRelationsModal({
                              open: true,
                              contact: {
                                parents: value[0],
                                parents_roles: value[1],
                              },
                              relationId: contact.id,
                              onRelationChange: (_id, relation) => {
                                if (relation) {
                                  onChange(value[0], {
                                    ...value[1],
                                    [contact.id]: relation,
                                  });
                                } else {
                                  const newParents = value[0].filter(
                                    (id) => id !== contact.id
                                  );
                                  const newParentsRoles = _.omit(
                                    value[1],
                                    contact.id
                                  );
                                  onChange(newParents, newParentsRoles);
                                }
                              },
                            });
                          }}
                          icon={(p) => <PencilIcon {...p} />}
                        />
                      </>
                    ),
                  },
                ]
              : []),
          ]}
          onClick={(contact, event) =>
            navigate(getRoute(ROUTES.ContactsView, { id: contact.id }), {
              event,
            })
          }
        />
      </div>
    </PageBlock>
  );
};
