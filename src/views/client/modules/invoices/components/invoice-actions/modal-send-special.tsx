import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Info } from "@atoms/text";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { InvoicesApiClient } from "@features/invoices/api-client/invoices-api-client";
import { Invoices } from "@features/invoices/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { PaperAirplaneIcon, PrinterIcon } from "@heroicons/react/16/solid";
import { ModalHr } from "@views/client/_layout/page";
import _ from "lodash";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { atom, useRecoilState } from "recoil";
import { getPdfPreview } from "../invoices-preview/invoices-preview";
import { Tabs } from "@radix-ui/themes";

/**
 * Send special variation of invoice (proforma, delivery note, receipt)
 */

export const InvoiceSendSpecialModalAtom = atom<
  "delivery_slip" | "proforma" | "receipt_acknowledgement" | ""
>({
  key: "InvoiceSendSpecialModalAtom",
  default: "",
});

export const InvoiceSendSpecialModal = ({ id }: { id?: string }) => {
  const [open, setOpen] = useRecoilState(InvoiceSendSpecialModalAtom);
  return (
    <Modal open={!!open} onClose={() => setOpen("")}>
      {open && (
        <InvoiceSendSpecialModalContent
          id={id}
          as={open}
          onClose={() => setOpen("")}
        />
      )}
    </Modal>
  );
};

const getDefaultContent = (
  draft: Invoices,
  as?: "delivery_slip" | "proforma" | "receipt_acknowledgement"
) => {
  return (
    draft.content?.map((line, index) => {
      if (
        !(
          line.type === "consumable" ||
          line.type === "product" ||
          line.type === "service"
        )
      ) {
        return { _index: index, quantity: 0 };
      }
      let qtt = line.quantity || 0;
      if (as === "delivery_slip") {
        qtt = line.quantity_delivered || 0;
      }
      return { _index: index, quantity: qtt };
    }) || []
  ).filter((c) => c.quantity > 0);
};

export const InvoiceSendSpecialModalContent = ({
  id,
  as,
  onClose,
}: {
  id?: string;
  as?: "delivery_slip" | "proforma" | "receipt_acknowledgement";
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { draft } = useReadDraftRest<Invoices>("invoices", id || "new");
  const [newEmail, setNewEmail] = useState<string>("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [mode, setMode] = useState<"all" | "partial">(
    as === "delivery_slip" ? "partial" : "all"
  );
  const [content, setContent] = useState<
    { _index: number; quantity: number }[]
  >(getDefaultContent(draft, as));

  const client = useContact(draft?.client);
  const contact = useContact(draft?.contact);

  const availableEmails = _.uniq([
    client?.contact?.email,
    contact?.contact?.email,
    ...(draft.recipients?.map((rec) => rec.email) || []),
    ...recipients,
  ]).filter(Boolean) as string[];

  return (
    <ModalContent
      title={
        as === "delivery_slip"
          ? t("invoices.send-special.titles.delivery_slip")
          : as === "proforma"
          ? t("invoices.send-special.titles.proforma")
          : t("invoices.send-special.titles.receipt_acknowledgement")
      }
    >
      <Tabs.Root
        value={mode}
        className="mb-4"
        onValueChange={(v) => {
          setMode(v as "all" | "partial");
          setContent(getDefaultContent(draft, as));
        }}
      >
        <Tabs.List>
          <Tabs.Trigger value="all">Document entier</Tabs.Trigger>
          <Tabs.Trigger value="partial">Sélectionner les lignes</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="all" className="my-2">
          <Info>Le document entier sera inclus.</Info>
        </Tabs.Content>
        <Tabs.Content value="partial">
          <Info className="block my-2">
            Sélectionnez les éléments à inclure dans le document.
          </Info>
          {draft.content?.map((line, index) => {
            if (
              !(
                line.type === "consumable" ||
                line.type === "product" ||
                line.type === "service"
              )
            ) {
              return <></>;
            }
            return (
              <div
                key={index}
                className="flex items-center justify-between mb-1"
              >
                <div className="truncate grow">{line.name}</div>
                {
                  <div className="text-right w-16 shrink-0">
                    <Input
                      size="sm"
                      type="number"
                      placeholder="0"
                      value={content?.find((c) => c._index === index)?.quantity}
                      onChange={(e) => {
                        setContent(
                          _.uniq([
                            ...content.filter((c) => c._index !== index),
                            {
                              _index: index,
                              quantity: parseInt(e.target.value),
                            },
                          ])
                        );
                      }}
                    />
                  </div>
                }
              </div>
            );
          })}
        </Tabs.Content>
      </Tabs.Root>

      <ModalHr />
      <div className="mt-2 space-y-0">
        {availableEmails.map((email) => (
          <div key={email} className="flex items-center justify-between">
            <Checkbox
              label={email}
              value={!!recipients?.find((rec) => rec === email)}
              labelProps={{ className: "truncate w-full block" }}
              onChange={(status) => {
                setRecipients(
                  _.uniq([
                    ...(recipients || []).filter((rec) => rec !== email),
                    ...(status ? [email.toLocaleLowerCase()] : []),
                  ]).filter((a) => !!a)
                );
              }}
            />
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
            setRecipients(
              _.uniq([
                ...recipients,
                ...(newEmail.split(",").map((e) => e.trim()) || []),
              ]).filter((a) => !!a)
            );
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
          onClick={() =>
            getPdfPreview(draft, {
              as,
              content: mode === "all" ? undefined : content,
            })
          }
        >
          Télécharger
        </Button>
        <Button
          disabled={!(recipients ?? []).filter(Boolean)?.length}
          size="sm"
          icon={(p) => <PaperAirplaneIcon {...p} />}
          onClick={async () => {
            try {
              InvoicesApiClient.send(draft, recipients || [], {
                as: as || "",
                content: mode === "all" ? undefined : content,
              });
              onClose();
              toast.success("Document envoyé");
            } catch (e) {
              toast.error("Erreur lors de l'envoi du document");
              console.error(e);
            }
          }}
        >
          Envoyer à {(recipients ?? []).filter(Boolean)?.length || 0}{" "}
          destinataires
        </Button>
        {!recipients?.length && (
          <Info className="block mt-2 text-red-400">
            Au moins un destinataire doît être présent
          </Info>
        )}
      </div>
    </ModalContent>
  );
};
