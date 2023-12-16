import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Input } from "@atoms/input/input-text";
import Link from "@atoms/link";
import { Info, Section, Subtitle, Title } from "@atoms/text";
import { PageLoader } from "@components/page-loader";
import environment from "@config/environment";
import { useAuth } from "@features/auth/state/use-auth";
import { CustomersApiClient } from "@features/customers/api-client/api-client";
import { ROUTES } from "@features/routes";
import { debounce } from "@features/utils/debounce";
import { stringToColor } from "@features/utils/format/strings";
import { PhotographIcon } from "@heroicons/react/solid";
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
  const [photoName, setPhotoName] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!emailValidation) {
    navigate(ROUTES.Login);
  }

  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    console.log(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        setImageBase64(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

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
                  debounce(
                    () =>
                      setPhotoName(
                        e.target.value
                          .split(" ")
                          .map((e) => e[0].toLocaleUpperCase())
                          .join("")
                          .slice(0, 2)
                      ),
                    {
                      key: "preferences:profile:photoName",
                      timeout: 1000,
                      doInitialCall: false,
                    }
                  );
                }}
              />
            }
          />

          <InputLabel
            label={t("signin.signup.photo")}
            className="mt-4"
            input={
              <>
                <div
                  style={
                    photoName
                      ? { backgroundColor: stringToColor(photoName) }
                      : {}
                  }
                  className="w-20 h-20 flex items-center justify-center rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-opacity-75 flex items-center justify-center cursor-pointer"
                  onClick={() =>
                    document.getElementById("profileImageInput")?.click()
                  }
                >
                  {" "}
                  {imageBase64 ? (
                    <img
                      src={imageBase64}
                      alt="Profile"
                      className="w-full h-full rounded-md object-cover"
                    />
                  ) : photoName ? (
                    <Title>{photoName}</Title>
                  ) : (
                    <PhotographIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="profileImageInput"
                    onChange={handleImageChange}
                  />
                </div>
                {!!imageBase64 && (
                  <Info noColor>
                    <Link
                      onClick={() => setImageBase64(null)}
                      className="text-red-500"
                    >
                      {t("signin.signup.removePhoto")}
                    </Link>
                  </Info>
                )}
                {!imageBase64 && (
                  <Info noColor>
                    <Link
                      onClick={() =>
                        document.getElementById("profileImageInput")?.click()
                      }
                    >
                      {t("signin.signup.addPhoto")}
                    </Link>
                  </Info>
                )}
              </>
            }
          />

          <div className="text-right mt-6">
            <Button
              size="lg"
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
