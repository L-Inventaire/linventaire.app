import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Info } from "@atoms/text";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { Invoices } from "@features/invoices/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  PaperAirplaneIcon,
  PrinterIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { ModalHr } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { atom, useRecoilState } from "recoil";
import { getPdfPreview } from "../invoices-preview/invoices-preview";

export const InvoiceSendModalAtom = atom<boolean>({
  key: "InvoiceSendModalAtom",
  default: false,
});

export const InvoiceSendModal = ({ id }: { id?: string }) => {
  const [open, setOpen] = useRecoilState(InvoiceSendModalAtom);
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      {open && (
        <InvoiceSendModalContent id={id} onClose={() => setOpen(false)} />
      )}
    </Modal>
  );
};

export const InvoiceSendModalContent = ({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) => {
  const { draft, setDraft, save } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new"
  );
  const [newMails, setNewMails] = useState<string>("");

  const client = useContact(draft?.client);
  const contact = useContact(draft?.contact);

  const availableEmails = _.uniq([
    client?.contact?.email,
    contact?.contact?.email,
    ...(draft.recipients || []),
  ]).filter(Boolean) as string[];

  useEffect(() => {
    if (draft.recipients?.length === 0) {
      setDraft({
        ...draft,
        recipients: availableEmails,
      });
    }
  }, []);

  return (
    <ModalContent title="Envoyer le document">
      <Info className="block mb-4">
        Choisir les destinataires de ce document. Les adresses emails des
        contacts principaux sont déjà ajoutées mais peuvent être retirés.
      </Info>

      <ModalHr />

      <div className="mt-2 space-y-2">
        {availableEmails.map((email) => (
          <div key={email}>
            <Checkbox
              label={email}
              value={draft.recipients?.includes(email)}
              icon={
                [client?.contact?.email, contact?.contact?.email].includes(
                  email
                )
                  ? undefined
                  : (p) => <TrashIcon {...p} />
              }
              onChange={(status) =>
                setDraft({
                  ...draft,
                  recipients: _.uniq([
                    ...(draft.recipients || []).filter((a) => a !== email),
                    ...(status ? [email.toLocaleLowerCase()] : []),
                  ]),
                })
              }
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex -space-x-px">
        <Input
          className="rounded-r-none"
          size="md"
          placeholder="email@gmail.com, email@linventaire.app"
          value={newMails}
          onChange={(e) => setNewMails(e.target.value)}
        />
        <Button
          className="rounded-l-none"
          theme="outlined"
          size="md"
          onClick={() => {
            setDraft({
              ...draft,
              recipients: _.uniq([
                ...(draft.recipients || []),
                ...(newMails
                  .toLocaleLowerCase()
                  .match(
                    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
                  ) || []),
              ]),
            });
            setNewMails("");
          }}
          shortcut={["enter"]}
        >
          Ajouter
        </Button>
      </div>

      <ModalHr />

      <div className="text-right mt-4 m-grid-1">
        <Button
          theme="outlined"
          size="lg"
          icon={(p) => <PrinterIcon {...p} />}
          onClick={() => getPdfPreview()}
        >
          Télécharger
        </Button>
        <Button
          disabled={!draft.recipients?.length}
          size="lg"
          icon={(p) => <PaperAirplaneIcon {...p} />}
          onClick={async () => {
            try {
              console.log(draft.state);
              await save({ state: "sent" });
              // TODO: call endpoint to send the invoice
              onClose();
              toast.success("Document envoyé");
            } catch (e) {
              toast.error("Erreur lors de l'envoi du document");
              console.error(e);
            }
          }}
        >
          Envoyer à {draft.recipients?.length || 0} destinataires
        </Button>
      </div>
    </ModalContent>
  );
};
