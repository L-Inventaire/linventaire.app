import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { FormInput } from "@components/form/fields";
import { RestDocumentsInput } from "@components/input-rest";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { useClients } from "@features/clients/state/use-clients";
import { getContactName } from "@features/contacts/types/types";
import { CRMItem } from "@features/crm/types/types";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { UserIcon } from "@heroicons/react/24/solid";
import { EditorInput } from "@molecules/editor-input";
import { Heading } from "@radix-ui/themes";
import { atom, useRecoilState } from "recoil";

export const CRMItemModalAtom = atom<{
  id?: string;
  open: boolean;
  readonly?: boolean;
  type: "new" | "qualified" | "proposal" | "won" | "lost";
}>({
  key: "CRMItemModalAtom",
  default: {
    id: "new",
    type: "new",
    open: false,
    readonly: false,
  },
});

export const CRMItemsModal = () => {
  const [modal, setModal] = useRecoilState(CRMItemModalAtom);

  return (
    <Modal
      open={modal.open}
      onClose={() => {
        setModal((mod) => ({ ...mod, open: false }));
      }}
    >
      {modal.open && <CRMItemsModalContent />}
    </Modal>
  );
};

export const CRMItemsModalContent = () => {
  const { client } = useClients();
  const [modal, setModal] = useRecoilState(CRMItemModalAtom);

  const { ctrl, draft, remove, save, isInitiating } = useDraftRest<CRMItem>(
    "crm_items",
    modal?.id || "new",
    async () => {
      setModal((mod) => ({ ...mod, open: false }));
    },
    {
      state: modal?.type ?? "new",
      seller: client?.user_id || "",
    }
  );

  if (isInitiating) return <div></div>;

  return (
    <ModalContent title="Proposition">
      <div className="space-y-4">
        <FormInput
          label="Status"
          type="select"
          ctrl={ctrl("state")}
          readonly={modal.readonly}
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
              label: "Gagné",
              value: "won",
            },
          ]}
        />

        <InputLabel
          label="Description"
          input={
            <EditorInput
              disabled={modal.readonly}
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
            disabled={modal.readonly}
          />
        </div>

        <div className="space-y-2">
          <Heading size="2">Vendeur</Heading>
          <UsersInput
            value={[ctrl("seller").value]}
            onChange={(v) => ctrl("seller").onChange(v[0])}
            disabled={modal.readonly}
            max={1}
          />
        </div>

        <div className="flex w-full">
          <div className="w-1/2 space-y-2">
            <Heading size="2">Assignés</Heading>
            <UsersInput ctrl={ctrl("assigned")} />
          </div>

          <div className="w-1/2 space-y-2">
            <Heading size="2">Tags</Heading>
            <TagsInput ctrl={ctrl("tags")} />
          </div>
        </div>
      </div>

      <div></div>

      {!modal.readonly && (
        <div className="flex items-center">
          {!!modal.id && (
            <Button
              className="mt-4"
              theme="danger"
              size="sm"
              onClick={() => {
                remove();
                setModal((mod) => ({ ...mod, open: false }));
              }}
            >
              Supprimer
            </Button>
          )}
          <div className="grow" />
          <Button
            className="mt-4"
            theme="primary"
            size="sm"
            disabled={!draft.state || !draft.notes}
            onClick={async () => {
              if (!draft || modal.readonly) return;
              const res = await save({
                ...draft,
                contacts: draft.contacts || [],
                seller: draft.seller || client?.user_id || "",
                state: (draft.state || modal?.type) ?? "new",
              });
              if (res) {
                setModal((mod) => ({ ...mod, open: false }));
              }
            }}
          >
            Enregistrer
          </Button>
        </div>
      )}
    </ModalContent>
  );
};
