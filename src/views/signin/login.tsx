import { Button } from "@atoms/button/button";
import InputCode from "@atoms/input/input-code";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Input } from "@atoms/input/input-text";
import Link from "@atoms/link";
import { Section, Subtitle } from "@atoms/text";
import { PageLoader } from "@components/page-loader";
import environment from "@config/environment";
import { AuthApiClient } from "@features/auth/api-client/api-client";
import { useAuth } from "@features/auth/state/use-auth";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const Login = () => {
  const { loading: authLoading, userCached, login } = useAuth();
  const [methods, setMethods] = useState<
    ("email" | "password" | "app" | "phone")[]
  >([]);
  const [mode, setMode] = useState<"email" | "password" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useControlledEffect(() => {
    if (mode === "email" && email) {
      (window as any).grecaptcha.enterprise.ready(async () => {
        const captchaValidation = await (
          window as any
        ).grecaptcha.enterprise.execute(environment.reCaptchaSiteKey, {
          action: "captcha",
        });
        if (!(await AuthApiClient.requestEmailMFA(email, captchaValidation))) {
          setMode(null);
          toast.error("Failed to send authentication code");
        }
      });
    }
  }, [mode]);

  return (
    <div>
      {authLoading && <PageLoader />}
      {!authLoading && (
        <>
          {userCached?.id && (
            <div className="text-center">
              <Section>
                {t("signin.login.title", [userCached?.fullName])}
              </Section>
              <Subtitle>{t("signin.login.subtitle")}</Subtitle>
            </div>
          )}
          {!userCached?.id && (
            <div className="text-center">
              <Section>{t("signin.login.welcome")}</Section>
              <Subtitle>{t("signin.login.welcome_subtitle")}</Subtitle>
            </div>
          )}
          <InputLabel
            label={t("signin.login.email")}
            className="mt-4"
            input={
              <div className="flex flex-row">
                <Input
                  size="lg"
                  value={email}
                  placeholder="jeff@books.com"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setMode(null);
                  }}
                />
              </div>
            }
          />

          {mode === "password" && (
            <InputLabel
              label={t("signin.login.password")}
              className="mt-4"
              input={
                <div className="flex flex-row">
                  <Input
                    size="lg"
                    value={password}
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              }
            />
          )}

          {mode === "email" && (
            <InputLabel
              label={t("signin.login.code")}
              className="mt-4"
              input={
                <div className="flex flex-row">
                  <InputCode onComplete={(e) => setCode(e)} />
                </div>
              }
            />
          )}

          <div className="flex flex-row">
            <div className="grow">
              {methods.length > 1 && (
                <Link
                  onClick={() =>
                    setMode(mode === "email" ? "password" : "email")
                  }
                >
                  {mode === "email" && t("signin.login.password_instead")}
                  {mode === "password" && t("signin.login.email_instead")}
                </Link>
              )}
            </div>
            <Button
              className="mt-6"
              size="lg"
              loading={loading}
              shortcut={["enter"]}
              disabled={
                !email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) ||
                (!password && mode === "password") ||
                (!code && mode === "email")
              }
              onClick={async () => {
                setLoading(true);
                try {
                  if (!mode) {
                    const { methods } = await AuthApiClient.getAvailableMFAs(
                      email
                    );
                    setMethods(methods.map((a) => a.method));
                    setMode(
                      methods.find((a) => a.method === "password")
                        ? "password"
                        : "email"
                    );
                  } else {
                    (window as any).grecaptcha.enterprise.ready(async () => {
                      const captchaValidation = await (
                        window as any
                      ).grecaptcha.enterprise.execute(
                        environment.reCaptchaSiteKey,
                        {
                          action: "captcha",
                        }
                      );
                      if (await AuthApiClient.getAvailableMFAs(email)) {
                        toast.success("Logged in successfully");
                      } else {
                        toast.error("Failed to log in");
                      }
                    });
                  }
                } catch (e) {
                  toast.error("An error occured");
                }

                setLoading(false);
              }}
            >
              {t("general.continue")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
