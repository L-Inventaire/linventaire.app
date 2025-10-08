import { InputLabel } from "@atoms/input/input-decoration-label";
import { PageLoader } from "@atoms/page-loader";
import { FormInput } from "@components/form/fields";
import { RestDocumentsInput } from "@components/input-rest";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { getContactName } from "@features/contacts/types/types";
import { CRMItem } from "@features/crm/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { UserIcon } from "@heroicons/react/24/solid";
import { EditorInput } from "@molecules/editor-input";
import { Heading } from "@radix-ui/themes";

export const CRMDetails = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const {
    draft: crmItem,
    ctrl,
    isPending,
  } = useReadDraftRest<CRMItem>("crm_items", id || "new", readonly);

  if (isPending || (id && crmItem.id !== id)) return <PageLoader />;

  return (
    <div className="grow @lg:w-full max-w-4xl mx-auto">
      <div className="space-y-4">
        <FormInput
          label="Status"
          type="select"
          ctrl={ctrl("state")}
          readonly={readonly}
          options={[
            {
              label: "Nouveau",
              value: "new",
            },
            {
              label: "Qualifié",
              value: "qualified",
            },
            {
              label: "Proposition",
              value: "proposal",
            },
            {
              label: "Terminé",
              value: "won",
            },
          ]}
        />

        <InputLabel
          label="Description"
          input={
            <EditorInput
              autoFocus
              disabled={readonly}
              value={ctrl("notes").value}
              onChange={ctrl("notes").onChange}
              className="w-full"
            />
          }
        />

        <div className="space-y-2">
          <Heading size="2">Clients</Heading>
          <RestDocumentsInput
            className="w-full"
            label="Clients"
            placeholder="Aucun client"
            entity="contacts"
            max={3}
            ctrl={ctrl("contacts")}
            icon={(p) => <UserIcon {...p} />}
            render={(contact, contacts) => {
              if (contacts)
                return contacts.map((c) => getContactName(c)).join(", ");

              return getContactName(contact);
            }}
            size="lg"
            disabled={readonly}
          />
        </div>

        <div className="space-y-2">
          <Heading size="2">Vendeur</Heading>
          <UsersInput
            value={[ctrl("seller").value]}
            onChange={(v) => ctrl("seller").onChange(v[0])}
            disabled={readonly}
            max={1}
          />
        </div>

        <div className="flex w-full">
          <div className="w-1/2 space-y-2">
            <Heading size="2">Assignés</Heading>
            <UsersInput disabled={readonly} ctrl={ctrl("assigned")} />
          </div>

          <div className="w-1/2 space-y-2">
            <Heading size="2">Tags</Heading>
            <TagsInput disabled={readonly} ctrl={ctrl("tags")} />
          </div>
        </div>
      </div>
    </div>
  );
};
