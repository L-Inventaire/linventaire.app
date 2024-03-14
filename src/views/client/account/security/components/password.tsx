import { Alert } from "@atoms/alert";
import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import * as Text from "@atoms/text";
import { MFAVerificationModal } from "@components/auth/mfa-verification-modal";
import { PageLoader } from "@components/page-loader";
import { MethodType } from "@features/customers/api-client/mfa-api-client";
import { useCustomerMfa } from "@features/customers/state/hooks";
import { ExclamationCircleIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";

export const SecurityPassword = (props: { mfa?: MethodType }) => {
  const { setMfa, deleteMfa } = useCustomerMfa();
  const [edited, setEdited] = useState(false);
  const [inMfaVerification, setInMfaVerification] = useState(false);
  const [newMfa, setNewMfa] = useState<{
    type: string;
    value: string;
    validation_token: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  useEffect(() => {
    if (edited) {
      setPassword("");
      setPasswordConfirmation("");
      setInMfaVerification(false);
      setNewMfa(null);
    }
  }, [edited]);

  return (
    <>
      <Modal
        open={edited}
        onClose={() => {
          setEdited(false);
          setNewMfa(null);
        }}
      >
        {edited && (
          <ModalContent
            title="Update your account password"
            text="Set a new password for your account."
          >
            <br />
            {!newMfa && (
              <>
                <Input
                  className="mb-4"
                  type="password"
                  autoComplete="off"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  className="mb-4"
                  type="password"
                  autoComplete="off"
                  placeholder="Confirm password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
                <Text.Info className="text-sm block">
                  Your password must contain at least 8 characters, including
                  one digit and one uppercase letter.
                </Text.Info>
                <br />

                <div>
                  <Button
                    disabled={
                      password !== passwordConfirmation ||
                      password.length < 8 ||
                      !/\d/.test(password) ||
                      !/[A-Z]/.test(password)
                    }
                    onClick={async () => {
                      setNewMfa({
                        type: "password",
                        value: password,
                        validation_token: "",
                      });
                      setInMfaVerification(true);
                    }}
                  >
                    Update account password
                  </Button>
                </div>
              </>
            )}
            {newMfa && <PageLoader />}
          </ModalContent>
        )}
      </Modal>

      <MFAVerificationModal
        text="Action: Update account password"
        excludeMfas={["password"]}
        open={inMfaVerification}
        onClose={() => {
          setInMfaVerification(false);
          setEdited(false);
          setNewMfa(null);
        }}
        onTokenExtended={async () => {
          if (newMfa) {
            if (newMfa.value) {
              await setMfa({
                type: newMfa.type as MethodType["type"],
                value: newMfa.value,
                validation_token: newMfa.validation_token,
              });
            } else if (props.mfa?.id) {
              await deleteMfa(props.mfa.id);
            }
          }
          setInMfaVerification(false);
          setEdited(false);
        }}
      />

      {props.mfa && (
        <div className="max-w-md">
          <Button
            className="mr-4 my-2"
            theme="default"
            onClick={() => setEdited(true)}
          >
            Change password
          </Button>
          <ButtonConfirm
            className="my-2"
            theme="danger"
            onClick={() => {
              setNewMfa({
                type: "password",
                value: "",
                validation_token: "",
              });
              setInMfaVerification(true);
            }}
          >
            Remove password access
          </ButtonConfirm>
        </div>
      )}
      {!props.mfa && (
        <>
          <Alert
            theme="gray"
            title="You have not set a password for your account"
            icon={ExclamationCircleIcon}
            bullets={[
              "You can set a password to login to your account instead of using one time code sent by email.",
            ]}
          >
            <Button
              className="mt-4"
              theme="default"
              onClick={() => setEdited(true)}
            >
              Set a password
            </Button>
          </Alert>
        </>
      )}
    </>
  );
};
