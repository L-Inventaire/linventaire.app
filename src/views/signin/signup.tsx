import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { InputImage } from "@atoms/input/input-image";
import { Input } from "@atoms/input/input-text";
import { Section, Subtitle } from "@atoms/text";
import { PageLoader } from "@atoms/page-loader";
import environment from "@config/environment";
import { useAuth } from "@features/auth/state/use-auth";
import { CustomersApiClient } from "@features/customers/api-client/api-client";
import { ROUTES } from "@features/routes";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const SignUp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const emailValidation = new URLSearchParams(document.location.search).get(
    "token"
  );
  const { loading: authLoading, login } = useAuth();
  const [name, setName] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!emailValidation) {
    navigate(ROUTES.Login);
  }

  const submit = async () => {
    setLoading(true);
    const grecaptcha = (window as any).grecaptcha.enterprise;
    grecaptcha.ready(async () => {
      const captchaValidation = await grecaptcha.execute(
        environment.reCaptchaSiteKey,
        {
          action: "captcha",
        }
      );

      try {
        if (emailValidation) {
          try {
            await CustomersApiClient.createAccount(
              captchaValidation,
              emailValidation,
              undefined,
              name
            );
            if (imageBase64) {
              await CustomersApiClient.setPreferences({
                avatar: imageBase64,
              });
            }
          } catch (e) {
            throw e;
          } finally {
            await login(emailValidation);
          }
        }
      } catch (e) {
        toast.error(t("signin.signup.error"));
        navigate(ROUTES.Login);
      }

      setLoading(false);
    });
  };

  return (
    <div>
      {authLoading && <PageLoader />}
      {!authLoading && (
        <>
          <div className="text-left">
            <Section>{t("signin.signup.title")}</Section>
            <Subtitle>{t("signin.signup.subtitle")}</Subtitle>
          </div>

          <InputLabel
            label={t("signin.signup.name")}
            className="mt-4"
            input={
              <Input
                size="lg"
                value={name}
                placeholder="Jeff Bezos"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            }
          />

          <InputLabel
            label={t("signin.signup.photo")}
            className="mt-4"
            input={
              <InputImage
                shape="circle"
                fallback={name}
                onChange={(b64) => setImageBase64(b64)}
              />
            }
          />

          <div className="text-right mt-6">
            <Button
              loading={loading}
              disabled={!name.trim()}
              onClick={async () => {
                submit();
              }}
            >
              {t("signin.signup.submit")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
