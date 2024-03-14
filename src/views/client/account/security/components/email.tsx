import { Button } from "@atoms/button/button";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { MFAVerificationModal } from "@components/auth/mfa-verification-modal";
import { VerifyEmail } from "@components/auth/verify-email";
import { PageLoader } from "@components/page-loader";
import { useAuth } from "@features/auth/state/use-auth";
import { MethodType } from "@features/customers/api-client/mfa-api-client";
import { useCustomerMfa } from "@features/customers/state/hooks";
import { useState } from "react";

export const SecurityEmail = (props: { mfa?: MethodType }) => {
  const { getUser } = useAuth();
  const { setMfa } = useCustomerMfa();
  const [edited, setEdited] = useState(false);
  const [inMfaVerification, setInMfaVerification] = useState(false);
  const [newMfa, setNewMfa] = useState<{
    type: string;
    value: string;
    validation_token: string;
  } | null>(null);

  return (
    <>
      <Modal
        open={edited}
        onClose={() => {
          setEdited(false);
          setNewMfa(null);
        }}
      >
        <ModalContent
          title="Update your account email"
          text="You must be the only one with access to this email."
        >
          <br />
          {!newMfa && (
            <VerifyEmail
              onComplete={async ({ email, token }) => {
                //In case this email is used by an other account
                setNewMfa({
                  type: "email",
                  value: email,
                  validation_token: token,
                });
                setInMfaVerification(true);
              }}
            />
          )}
          {newMfa && <PageLoader />}
        </ModalContent>
      </Modal>

      <MFAVerificationModal
        text="Action: Update account email"
        open={inMfaVerification}
        onClose={() => {
          setInMfaVerification(false);
          setEdited(false);
          setNewMfa(null);
        }}
        onTokenExtended={async () => {
          if (newMfa) {
            await setMfa({
              type: newMfa.type as MethodType["type"],
              value: newMfa.value,
              validation_token: newMfa.validation_token,
            });
            await getUser();
          }
          setInMfaVerification(false);
          setEdited(false);
        }}
      />

      <div className="max-w-md">
        {props.mfa && (
          <>
            <Input
              label="Email in use for login"
              value={props.mfa?.value}
              readOnly
            />
            <Button
              className="mt-3"
              theme="outlined"
              onClick={() => {
                setEdited(true);
                setNewMfa(null);
              }}
            >
              Change account email
            </Button>
          </>
        )}
        <br />
      </div>
    </>
  );
};
