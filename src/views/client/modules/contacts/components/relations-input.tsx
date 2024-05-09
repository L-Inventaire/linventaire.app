import { SectionSmall } from "@atoms/text";
import { RestDocumentsInput } from "@components/rest-documents-input";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts } from "@features/contacts/types/types";
import _ from "lodash";

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
  const { contacts } = useContacts({ query: [], key: "subcontacts+" + id });

  return (
    <>
      <SectionSmall>Parents</SectionSmall>

      {value[0].map((parent, i) => (
        <>parent</>
      ))}

      <RestDocumentsInput
        table="contacts"
        column="parents"
        max={1}
        value={[]}
        onChange={(parents) => {
          if (parents[0]) {
            onChange(_.uniq([...value[0], parents[0]]), {
              ...value[1],
              [parents[0]]: {
                role: "",
              },
            });
          }
        }}
      />
      <SectionSmall>Enfants</SectionSmall>
    </>
  );
};
