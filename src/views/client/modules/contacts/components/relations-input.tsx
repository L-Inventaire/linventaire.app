import { SectionSmall } from "@atoms/text";
import { RestDocumentsInput } from "@components/rest-documents-input";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts } from "@features/contacts/types/types";

export const RelationsInput = ({
  id,
  readonly,
  value,
  onChange,
}: {
  id: string;
  readonly?: boolean;
  value: [string[], Contacts["parents_roles"][0][]]; // parents, parents_roles
  onChange: (parents: string[], roles: Contacts["parents_roles"][0][]) => void;
}) => {
  const { contacts } = useContacts({ query: [], key: "subcontacts+" + id });

  return (
    <>
      <RestDocumentsInput
        table="contacts"
        column="parents"
        value={value[0]}
        onChange={(parents) => {
          console.log("parents", parents);
          onChange(parents, value[1]);
        }}
        max={1}
      />
      <SectionSmall>Parents</SectionSmall>
      <SectionSmall>Enfants</SectionSmall>
    </>
  );
};
