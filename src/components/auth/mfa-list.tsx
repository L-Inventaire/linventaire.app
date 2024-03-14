import A from "@atoms/link";
import { Button } from "@atoms/button/button";
import { Loader } from "@atoms/loader";
import { VerifyEmail } from "@components/auth/verify-email";
import { VerifyPhone } from "@components/auth/verify-phone";
import { AuthApiClient } from "@features/auth/api-client/api-client";
import { useAuth } from "@features/auth/state/use-auth";
import { ArrowRightIcon } from "@heroicons/react/outline";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VerifyApp } from "./verify-app";
import { VerifyPassword } from "./verify-password";
import { useTranslation } from "react-i18next";
import { Input } from "@atoms/input/input-text";

export const MfaList = (props: {
  onTokenExtended?: () => void;
  onStepChanged?: (step: "email" | "verification") => void;
  excludeMfas?: string[];
}) => {
  const { extendsToken: _extendsToken, user, userCached } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onTokenExtended = () => {
    props.onTokenExtended && props.onTokenExtended();
  };

  const extendsToken = useCallback(
    async (token: string, email?: string) => {
      const res = await _extendsToken(token, email);
      if (res) {
        onTokenExtended();
      } else {
        if (email)
          navigate(
            `/signup?email=${encodeURIComponent(
              email || ""
            )}&token=${encodeURIComponent(token)}`
          );
      }
    },
    [props.onTokenExtended, _extendsToken]
  );

  const [email, setEmail] = useState(user?.email || userCached?.email || "");

  const [isLoading, setIsLoading] = useState(false);
  const [mfaList, setMfaList] = useState<{ id: string; method: string }[]>([]);
  const [_secondaryMfaList, setSecondaryMfaList] = useState<
    { id: string; method: string }[]
  >([]);
  let secondaryMfaList = _secondaryMfaList;
  const [selectedMfa, setSelectedMfa] = useState<{
    id: string;
    method: string;
  } | null>(null);

  const getMfaList = async () => {
    setIsLoading(true);
    const data = await AuthApiClient.getAvailableMFAs(email);

    //We already have 2FA
    if (data.current_authentication_factors >= 2) {
      onTokenExtended();
      return;
    }

    setIsLoading(false);

    let methods = data.methods;
    const secondaryMethods: { id: string; method: string }[] = [];

    methods = methods.filter((method) => {
      if (props.excludeMfas) return !props.excludeMfas.includes(method.method);
      return true;
    });

    //If password is proposed then email code is a secondary option
    if (
      methods.map((a) => a.method).includes("password") &&
      methods.map((a) => a.method).includes("email")
    ) {
      secondaryMethods.push(methods.find((a) => a.method === "email") as any);
      methods = methods.filter((a) => a.method !== "email");
    }

    setMfaList(methods || []);
    setSecondaryMfaList(secondaryMethods || []);

    if (methods.length === 1) {
      setSelectedMfa(methods[0]);
    }

    if (methods.length === 0) {
      onTokenExtended();
    }
  };

  if (selectedMfa) {
    secondaryMfaList = [...secondaryMfaList, ...mfaList].filter(
      (a) => a.method !== selectedMfa.method
    );
  }

  useEffect(() => {
    if (email) getMfaList();
  }, []);

  useEffect(() => {
    if (props.onStepChanged)
      props.onStepChanged(mfaList.length === 0 ? "email" : "verification");
  }, [mfaList.length]);

  return (
    <>
      {isLoading && (
        <div className="block text-center py-8">
          <Loader />
        </div>
      )}

      {!isLoading && mfaList.length === 0 && (
        <>
          <Input
            type="text"
            label={t("signin.login.email")}
            autoComplete="email"
            placeholder="bruce.wayne@wayne.co"
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="text-center pt-8">
            <Button
              loading={isLoading}
              disabled={
                !/^\w+([.+-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(email)
              }
              onClick={() => getMfaList()}
            >
              {t("signin.login.continue")}
              <ArrowRightIcon
                className="ml-2 -mr-0.5 h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        </>
      )}

      {!isLoading && mfaList.length > 0 && !user?.email && (
        <p className="text-center pt-4 ">
          <span className="text-sm text-black dark:text-white opacity-50">
            {t("signin.login.continue_as") + " "} <strong>{email}</strong>{" "}
          </span>
          <A
            className={"text-sm"}
            onClick={() => {
              setMfaList([]);
              setSecondaryMfaList([]);
              setSelectedMfa(null);
            }}
          >
            {t("signin.login.change_email")}
          </A>
        </p>
      )}

      {!selectedMfa && (
        <div className="flex -space-y-px flex-col">
          {mfaList.map((mfa, i) => (
            <Button
              key={i}
              theme="default"
              type="button"
              className={
                " !shadow-none " +
                (mfaList.length > 1 && i > 0 && i < mfaList.length
                  ? "!rounded-none "
                  : "") +
                (i === 0 ? "!rounded-t-lg !rounded-b-none " : "") +
                (i === mfaList.length - 1
                  ? "!rounded-b-lg !rounded-t-none "
                  : "")
              }
              onClick={() => setSelectedMfa(mfa)}
            >
              {mfa.method === "password" && "Enter your password"}
              {mfa.method === "email" && "Send me a code by email"}
              {mfa.method === "phone" && "Send me a code by phone"}
              {mfa.method === "app" && "Use one time app code"}
            </Button>
          ))}
        </div>
      )}

      {selectedMfa && (
        <div>
          {selectedMfa.method === "password" && (
            <VerifyPassword
              email={email}
              isLoading={isLoading}
              onComplete={(args) => extendsToken(args.token, args.email)}
            />
          )}
          {selectedMfa.method === "email" && (
            <VerifyEmail
              deviceDisabled
              autoRequest
              initialValue={{ email }}
              onComplete={({ token }) => {
                extendsToken(token, email);
              }}
            />
          )}
          {selectedMfa.method === "phone" && (
            <VerifyPhone
              deviceDisabled={!!user?.phone}
              autoRequest={!!user?.phone}
              initialValue={
                user?.phone ? { phone: user?.phone || "" } : undefined
              }
              onComplete={({ token }) => {
                extendsToken(token);
              }}
            />
          )}
          {selectedMfa.method === "app" && (
            <VerifyApp
              email={email}
              isLoading={isLoading}
              onComplete={(args) => extendsToken(args.token, args.email)}
            />
          )}
        </div>
      )}

      {/* List of secondary MFA even if one was already selected */}
      {!secondaryMfaList
        .map((a) => a.method)
        .includes(selectedMfa?.method || "") &&
        secondaryMfaList.length > 0 && (
          <>
            <p className="block pt-2 text-center text-xs text-gray-500">Or</p>

            {secondaryMfaList.map((mfa, i) => (
              <A
                key={i}
                className={" block pt-2 text-center text-sm"}
                onClick={() => setSelectedMfa(mfa)}
              >
                {mfa.method === "password" && t("signin.login.mfa.password")}
                {mfa.method === "email" && t("signin.login.mfa.email")}
                {mfa.method === "phone" && t("signin.login.mfa.phone")}
                {mfa.method === "app" && t("signin.login.mfa.app")}
              </A>
            ))}
          </>
        )}
    </>
  );
};
