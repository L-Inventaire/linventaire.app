import { Modal, ModalContent } from "@atoms/modal/modal";
import { RestDocumentsInput } from "@components/input-rest";
import { Contacts } from "@features/contacts/types/types";
import { EditorInput } from "@molecules/editor-input";
import { Button, Heading, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { atom, useRecoilState } from "recoil";

export const ContactRelationModalAtom = atom<{
  open: boolean;
  relationId?: string;
  contact?: Pick<Contacts, "parents" | "parents_roles">;
  onRelationChange?: (
    contactId: string,
    relation: Contacts["parents_roles"]["any"] | null
  ) => void;
}>({
  key: "ContactRelationModalAtom",
  default: {
    open: false,
  },
});

export const ContactRelationModal = () => {
  const [modal, setModal] = useRecoilState(ContactRelationModalAtom);
  return (
    <Modal
      open={modal.open && !!modal.onRelationChange && !!modal.contact}
      onClose={() => setModal({ open: false })}
    >
      {modal.open && <ContactRelationModalContent />}
    </Modal>
  );
};

const ContactRelationModalContent = () => {
  const [modal, setModal] = useRecoilState(ContactRelationModalAtom);
  const [contact, setContact] = useState<string>(modal.relationId || "");
  const [role, setRole] = useState<string>(
    modal.contact?.parents_roles[modal.relationId || ""]?.role || ""
  );
  const [notes, setNotes] = useState<string>(
    modal.contact?.parents_roles[modal.relationId || ""]?.notes || ""
  );
  return (
    <ModalContent title="Éditer la relation">
      <div className="space-y-6">
        <div className="space-y-2">
          <Heading size="2">Contact</Heading>
          <RestDocumentsInput
            entity="contacts"
            size="xl"
            label="Choisir un contact"
            value={contact}
            onChange={(parent) => {
              setContact(parent);
            }}
            disabled={!!modal.relationId}
          />
        </div>
        <div className="space-y-2">
          <Heading size="2">Type de relation</Heading>
          <TextField.Root
            placeholder="Relation"
            size="3"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Heading size="2">Notes</Heading>
          <EditorInput
            placeholder={"Cliquez pour ajouter des notes"}
            value={notes}
            onChange={(e) => setNotes(e)}
          />
        </div>
        <div className="flex flex-row">
          {modal.relationId && (
            <Button
              color="red"
              onClick={() => {
                modal.onRelationChange?.("", null);
                setModal({ open: false });
              }}
            >
              Supprimer la relation
            </Button>
          )}
          <div className="grow" />
          <Button
            disabled={!contact}
            onClick={() => {
              modal.onRelationChange?.(contact, {
                role: role,
                notes,
              });
              setModal({ open: false });
            }}
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </ModalContent>
  );
};
