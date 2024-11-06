import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import Radio from "@atoms/input/input-select-radio";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Base, Info } from "@atoms/text";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { SigningSessionsApiClient } from "@features/documents/api-client/api-client";
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
import { useParams } from "react-router-dom";
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
  const { client: clientId } = useParams();
  const { draft, setDraft, save } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new"
  );
  const [newEmail, setNewEmail] = useState<string>("");
  const [finalState, setFinalState] = useState<"sent" | "draft">("sent");

  const client = useContact(draft?.client);
  const contact = useContact(draft?.contact);

  const availableEmails = _.uniq([
    client?.contact?.email,
    contact?.contact?.email,
    ...(draft.recipients?.map((rec) => rec.email) || []),
  ]).filter(Boolean) as string[];

  useEffect(() => {
    if (draft.recipients?.length === 0) {
      setDraft({
        ...draft,
        recipients: availableEmails.map((email) => ({ email, role: "signer" })),
      });
    }
  }, []);

  return (
    <ModalContent title="Envoyer le document">
      <Info className="block mb-4">
        Choisir les destinataires de ce document. Les adresses emails des
        contacts principaux sont déjà ajoutées mais peuvent être retirés.
      </Info>

      <Radio
        label="Statut final"
        className="flex w-full shadow-none"
        value={finalState}
        onChange={(e) => {
          setFinalState(e as any);
        }}
        placeholder={"Statut"}
        options={[
          { label: "Brouillon", value: "draft" },
          { label: "Envoyé", value: "sent" },
        ]}
      />

      <ModalHr />

      <div className="mt-2 space-y-2">
        {availableEmails.map((email) => (
          <div key={email} className="flex items-center justify-between">
            <Checkbox
              label={email}
              value={!!draft?.recipients?.find((rec) => rec.email === email)}
              icon={
                [client?.contact?.email, contact?.contact?.email].includes(
                  email
                )
                  ? undefined
                  : (p) => <TrashIcon {...p} />
              }
              labelWrapperProps={{ className: "max-w-[40%]" }}
              labelProps={{ className: "truncate w-full block" }}
              onChange={(status) => {
                setDraft({
                  ...draft,
                  recipients: _.uniq([
                    ...(draft.recipients || []).filter(
                      (rec) => rec.email !== email
                    ),
                    ...(status
                      ? [
                          {
                            email: email.toLocaleLowerCase(),
                            role: "signer" as "signer" | "viewer",
                          },
                        ]
                      : []),
                  ]).filter((a) => !!a),
                });
              }}
            />
            <div className="flex items-center ml-2">
              <Base className="mr-2 font-semibold">Action</Base>

              <Radio
                value={
                  draft?.recipients?.find((rec) => rec.email === email)?.role ??
                  "signer"
                }
                onChange={(e) => {
                  setDraft((data) => ({
                    ...data,
                    recipients: (data.recipients ?? []).map((rec) =>
                      rec?.email === email
                        ? { email: rec.email, role: e as "signer" | "viewer" }
                        : rec
                    ),
                  }));
                }}
                className="shadow-none m-0"
                placeholder={"Statut"}
                options={[
                  { label: "Signer", value: "signer" },
                  { label: "Voir", value: "viewer" },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex space-x-2">
        <Input
          size="md"
          placeholder="email@gmail.com, email@linventaire.app"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <Button
          theme="outlined"
          size="sm"
          onClick={() => {
            setDraft({
              ...draft,
              recipients: _.uniq([
                ...(draft.recipients || []),
                ...(
                  newEmail
                    .toLocaleLowerCase()
                    .match(
                      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
                    ) || []
                )
                  .map((email) => ({
                    email,
                    role: "signer" as "signer" | "viewer",
                  }))
                  .filter((a) => !!a),
              ]),
            });
            setNewEmail("");
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
          size="sm"
          icon={(p) => <PrinterIcon {...p} />}
          onClick={() => getPdfPreview(draft)}
        >
          Télécharger
        </Button>
        <Button
          disabled={
            !(draft.recipients ?? []).filter(Boolean)?.length ||
            !draft.recipients?.some((rec) => rec.role === "signer")
          }
          size="sm"
          icon={(p) => <PaperAirplaneIcon {...p} />}
          onClick={async () => {
            try {
              if (!clientId) {
                toast.error("Erreur lors de l'envoi du document");
                return;
              }

              if (finalState === "draft") {
                await save({ state: "draft" });
              }
              if (finalState === "sent") {
                await save({ state: "sent" });
              }

              SigningSessionsApiClient.sendInvoice(
                clientId,
                draft.id,
                draft.recipients ?? []
              );

              onClose();
              toast.success("Document envoyé");
            } catch (e) {
              toast.error("Erreur lors de l'envoi du document");
              console.error(e);
            }
          }}
        >
          Envoyer à {(draft.recipients ?? []).filter(Boolean)?.length || 0}{" "}
          destinataires
        </Button>
        {!draft.recipients?.some((rec) => rec.role === "signer") && (
          <Info className="block mt-2 text-red-400">
            Au moin un destinataire doît être un signataire
          </Info>
        )}
      </div>
    </ModalContent>
  );
};
