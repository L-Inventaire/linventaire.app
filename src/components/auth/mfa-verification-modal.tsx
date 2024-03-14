import { Modal, ModalContent } from "@atoms/modal/modal";
import { useAuth } from "@features/auth/state/use-auth";
import { MethodType } from "@features/customers/api-client/mfa-api-client";
import { ClipboardCheckIcon } from "@heroicons/react/outline";
import { useEffect, useRef } from "react";
import { MfaList } from "./mfa-list";

export const MFAVerificationModal = (props: {
  open: boolean;
  text: string;
  onClose: () => void;
  onTokenExtended: () => void;
  excludeMfas?: MethodType["type"][];
  fa1token?: string;
  email?: string;
  methods?: { id: string; method: string }[];
}) => {
  const { getExtractedToken } = useAuth();
  const callOnce = useRef(false);

  const alreadyHas2FA = (getExtractedToken()?.mfa.length || 0) >= 2;

  const onTokenExtended = () => {
    if (callOnce.current) return;
    callOnce.current = true;
    props.onTokenExtended && props.onTokenExtended();
  };

  useEffect(() => {
    if (props.open) {
      if (alreadyHas2FA) onTokenExtended();
    } else {
      callOnce.current = false;
    }
  }, [props.open]);

  if (alreadyHas2FA) {
    return <></>;
  }

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <ModalContent
        icon={ClipboardCheckIcon}
        theme="warning"
        title="Verify this action"
        text={props.text}
      >
        <br />
        <MfaList
          onTokenExtended={onTokenExtended}
          excludeMfas={props.excludeMfas}
          fa1token={props.fa1token}
          email={props.email}
          methods={props.methods}
        />
      </ModalContent>
    </Modal>
  );
};
