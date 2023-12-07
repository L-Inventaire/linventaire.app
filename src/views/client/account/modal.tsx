import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { BaseSmall, Info } from "@atoms/text";
import { useAuth } from "@features/auth/state/use-auth";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { atom, useRecoilState } from "recoil";

export const AccountModalAtom = atom({
  key: "AccountModalAtom",
  default: false,
});

const passwordCheckRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const AccountModal = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [updatePassword, setUpdatePassword] = useState(false);
  const [accountModal, setAccountModal] = useRecoilState(AccountModalAtom);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    passwordConfirm: "",
  });

  return (
    <>
      <Modal open={accountModal} onClose={() => setAccountModal(false)}>
        <ModalContent title={t("account.modal.title")}>
          <Info>Update your personnal account information here.</Info>

          <Button
            className="!block mb-2 mt-6"
            onClick={() => setUpdatePassword(true)}
          >
            Update password
          </Button>

          <Button className="block" theme="danger" onClick={() => logout()}>
            Logout
          </Button>
        </ModalContent>
      </Modal>
      <Modal open={updatePassword} onClose={() => setUpdatePassword(false)}>
        <ModalContent title="Update account password">
          <InputLabel
            label="Current password"
            input={
              <Input
                placeholder="••••••••"
                type="password"
                value={form.currentPassword}
                onChange={(e) =>
                  setForm({ ...form, currentPassword: e.target.value })
                }
              />
            }
          />

          <BaseSmall className="mt-8 block">
            Your new password must be at least 8 characters long and contain at
            least 1 uppercase letter, 1 lowercase letter, 1 number, and 1
            special character.
          </BaseSmall>

          <InputLabel
            className="mt-4"
            label="New password"
            input={
              <Input
                placeholder="••••••••"
                hasError={!form.newPassword.match(passwordCheckRegex)}
                type="password"
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
              />
            }
          />
          <InputLabel
            className="mt-4"
            label="New password confirmation"
            input={
              <Input
                placeholder="••••••••"
                hasError={!form.newPassword.match(passwordCheckRegex)}
                type="password"
                value={form.passwordConfirm}
                onChange={(e) =>
                  setForm({ ...form, passwordConfirm: e.target.value })
                }
              />
            }
          />
          <Button
            className="mt-6 float-right"
            disabled={
              form.newPassword !== form.passwordConfirm ||
              !form.passwordConfirm ||
              !form.newPassword
            }
            loading={passwordLoading}
            onClick={async () => {
              setPasswordLoading(true);
              toast.error(
                "Unable to change your password, check your current and new password and try again."
              );
              setPasswordLoading(false);
            }}
          >
            Change password and logout
          </Button>
        </ModalContent>
      </Modal>
    </>
  );
};
