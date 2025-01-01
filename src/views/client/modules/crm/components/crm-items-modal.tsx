import { Button } from "@atoms/button/button";
import { Modal } from "@atoms/modal/modal";
import { Base, Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { RestDocumentsInput } from "@components/input-rest";
import { UsersInput } from "@components/input-rest/users";
import { useClients } from "@features/clients/state/use-clients";
import { CRMItem } from "@features/crm/types/types";
import { getContactName } from "@features/contacts/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { UserIcon } from "@heroicons/react/24/solid";
import { atom, useRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";

export const CRMItemModalAtom = atom<{
  id?: string;
  open: boolean;
  readonly?: boolean;
  type: "new" | "qualified" | "proposal" | "won";
  onClose?: () => void;
  onSave?: (value: Partial<CRMItem>) => void;
}>({
  key: "CRMItemModalAtom",
  default: {
    id: "new",
    type: "new",
    open: false,
    readonly: false,
    onClose: () => {},
    onSave: () => {},
  },
});

export const CRMItemsModal = () => {
  const { client } = useClients();
  const [modal, setModal] = useRecoilState(CRMItemModalAtom);

  const { ctrl, draft } = useReadDraftRest<CRMItem>(
    "crm_items",
    modal?.id || "new",
    modal?.readonly
  );

  return (
    <Modal
      open={modal.open}
      onClose={() => {
        setModal((mod) => ({ ...mod, open: false }));
        modal.onClose?.();
      }}
    >
      <Section className="mb-4">Enregistrer un prospect</Section>
      <FormInput
        autoSelectAll
        type="text"
        label="Notes"
        ctrl={ctrl("notes")}
        className="w-16 mb-4"
        inputClassName={twMerge("w-full")}
      />

      <Base className="block font-bold mb-1">Clients</Base>

      <RestDocumentsInput
        className="mb-4"
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
        size="sm"
        disabled={modal.readonly}
      />

      <Base className="block font-bold mb-1">Vendeur</Base>

      <UsersInput ctrl={ctrl("seller")} disabled={modal.readonly} max={1} />
      <div></div>

      {!modal.readonly && (
        <Button
          className="mt-4"
          theme="primary"
          size="md"
          disabled={modal.readonly}
          onClick={() => {
            if (!draft || modal.readonly) return;

            console.log("TEST", {
              ...draft,
              seller: client?.user_id || "",
              state: modal?.type ?? "new",
            });

            modal.onSave?.({
              ...draft,
              seller: client?.user_id || "",
              state: modal?.type ?? "new",
            });
            modal.onClose?.();
          }}
        >
          Enregistrer
        </Button>
      )}
    </Modal>
  );
};
