import { Button } from "@atoms/button/button";
import Link from "@atoms/link";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import {
  SignatureApiClient,
  SignatureResponse,
} from "@features/utils/signature/api-client";
import { TrashIcon } from "@heroicons/react/24/outline";
import { PencilIcon } from "@heroicons/react/24/solid";
import Signature, { SignatureRef } from "@uiw/react-signature";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Input } from "./input-text";
import { format as formatDate } from "date-fns";

export interface SignatureData extends SignatureResponse {
  id?: string;
}

export interface InputSignatureProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  clientId: string;
  disabled?: boolean;
}

export const InputSignature = ({
  value = [],
  onChange,
  clientId,
  disabled = false,
}: InputSignatureProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [signatures, setSignatures] = useState<SignatureData[]>(
    value.map((sig) => JSON.parse(sig))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signatureRef = useRef<SignatureRef>(null);

  useEffect(() => {
    setSignatures(value.map((sig) => JSON.parse(sig)));
  }, [value]);

  useControlledEffect(() => {
    onChange?.(signatures.map((sig) => JSON.stringify(sig)));
  }, [signatures]);

  const handleSaveSignature = async () => {
    if (!signatureRef.current) return;

    try {
      setIsSubmitting(true);
      let signatureSvg = signatureRef.current.svg?.outerHTML;
      const size = signatureRef.current.svg?.getBoundingClientRect();

      if (!signatureSvg) {
        throw new Error("Signature is empty");
      }

      signatureSvg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${
          size?.width || 158
        } ${size?.height || 135.5}" ` + signatureSvg.split("<svg")[1] || "";

      const response = await SignatureApiClient.saveSignature(
        clientId,
        signatureSvg,
        fullName
      );

      setSignatures([
        ...signatures,
        { ...response, id: Date.now().toString() },
      ]);
      setIsModalOpen(false);
      setFullName("");
    } catch (error) {
      console.error("Failed to save signature:", error);
      toast.error("Failed to save signature.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSignature = (id?: string) => {
    if (!id) return;

    setSignatures(signatures.filter((sig) => sig.id !== id));
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  return (
    <div>
      {signatures.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4 mt-2">
          {signatures.map((signature, index) => (
            <div
              key={signature.id || index}
              className="relative group border border-slate-100 dark:border-slate-700 rounded-md p-3 bg-white dark:bg-slate-900 shadow-sm"
            >
              <div className="w-48 h-24 rounded-md overflow-hidden bg-white">
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(
                    signature.svg
                  )}`}
                  alt={`Signature ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium">
                  {signature.full_name || t("atoms.signature.anonymous")}
                </div>
                <div className="text-xs text-slate-500">
                  {formatDate(new Date(signature.date), "yyyy-MM-dd HH:mm:ss")}
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={() => handleRemoveSignature(signature.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
          theme="outlined"
          size="sm"
          icon={(p) => <PencilIcon {...p} />}
        >
          {t("atoms.signature.add")}
        </Button>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent title={t("atoms.signature.title")}>
          <div className="flex flex-col gap-4 mt-4">
            <div className="border rounded-md bg-white p-2">
              <Signature ref={signatureRef} />
            </div>

            <div className="flex items-center gap-2">
              <Link
                onClick={clearSignature}
                className="text-sm text-blue-500 hover:underline"
              >
                {t("atoms.signature.clear")}
              </Link>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                {t("atoms.signature.fullName")} ({t("atoms.signature.optional")}
                )
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-slate-800"
                placeholder={t("atoms.signature.enterName")}
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button theme="outlined" onClick={() => setIsModalOpen(false)}>
                {t("atoms.common.cancel")}
              </Button>
              <Button
                onClick={handleSaveSignature}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {t("atoms.common.save")}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
};
