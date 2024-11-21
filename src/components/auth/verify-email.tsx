import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import InputCode from "@atoms/input/input-code";
import { Input } from "@atoms/input/input-text";
import A from "@atoms/link";
import { DelayedLoader } from "@atoms/loader";
import environment from "@config/environment";
import { AuthApiClient } from "@features/auth/api-client/api-client";
import { Transition } from "@headlessui/react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Trans } from "react-i18next";

let verifyEmailTimeout: any = 0;

export const VerifyEmail = (props: {
  showLegal?: boolean;
  initialValue?: { email: string };
  autoRequest?: boolean; //Will automatically send the email if email is already specified
  onComplete?: (args: { email: string; token: string }) => void;
  onVerificationStatusChange?: (verification: boolean) => void;
  deviceDisabled?: boolean;
}) => {
  const [legalConsent, setLegalConsent] = useState(false);
  const [autoRequest, setAutoRequest] = useState(props.autoRequest);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasTimeout, setHasTimeout] = useState(false);
  const [email, setEmail] = useState(props.initialValue?.email || "");
  const [challenge, setChallenge] = useState<{
    expire: number;
    token: string;
  } | null>(null);

  useEffect(() => {
    props?.onVerificationStatusChange &&
      props?.onVerificationStatusChange(!!challenge);
  }, [challenge]);

  useEffect(() => {
    if (autoRequest && email) requestMfa();
  }, []);

  //Clear interval on unmount
  useEffect(() => {
    return () => {
      clearTimeout(verifyEmailTimeout);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("email")) {
      setEmail(params.get("email") || "");
      if (params.get("token")) {
        props.onComplete?.({
          email: params.get("email") || "",
          token: params.get("token") || "",
        });
      }
    }
  }, []);

  const verifyMfa = async (code: string) => {
    setIsLoading(true);
    const data = await AuthApiClient.verifyEmailMFA(
      challenge?.token || "",
      code
    );
    if (!data?.success) {
      setHasError(true);
    } else {
      setHasError(false);
      setSuccess(true);

      setTimeout(() => {
        props.onComplete?.({ email, token: data.validation_token });
      }, 1000);
    }
    setIsLoading(false);
  };

  const requestMfa = async () => {
    if (!email) {
      return;
    }
    clearTimeout(verifyEmailTimeout);
    setHasTimeout(false);
    setIsLoading(true);
    const grecaptcha = (window as any).grecaptcha.enterprise;
    grecaptcha.ready(async () => {
      try {
        const captchaValidation = await grecaptcha.execute(
          environment.reCaptchaSiteKey,
          {
            action: "captcha",
          }
        );

        const data = await AuthApiClient.requestEmailMFA(
          email,
          captchaValidation
        );
        if (data.success) {
          setChallenge(data);
          verifyEmailTimeout = setTimeout(() => {
            setHasTimeout(true);
          }, 15000);
        } else {
          throw new Error("An error occured");
        }
      } catch (err) {
        console.error(err);
        setHasError(true);
      }

      setIsLoading(false);
    });
  };

  return (
    <>
      {!success && autoRequest && !challenge?.token && (
        <div className="block text-center my-8">
          <DelayedLoader />
        </div>
      )}

      {!success && !autoRequest && !challenge?.token && (
        <>
          <Input
            disabled={props.deviceDisabled}
            type="email"
            label="Enter an email"
            autoFocus
            placeholder="bruce.wayne@wayne.co"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          {hasError && (
            <p className="text-center text-red-500 text-sm my-4">
              An error occured. Please try with an other email.
            </p>
          )}

          {props.showLegal && (
            <div
              className="flex flex-row items-center pt-8 space-x-4"
              onClick={() => setLegalConsent(!legalConsent)}
            >
              <div>
                <Checkbox
                  value={legalConsent}
                  onChange={(value) => setLegalConsent(value)}
                />
              </div>
              <p className="text-xs text-left block text-gray-500">
                <Trans i18nKey={"signup.legal"}>
                  0
                  <A
                    target="_blank"
                    href="https://metawallet.plus/fr/legal/privacy"
                  >
                    1
                  </A>
                  <A
                    target="_blank"
                    href="https://metawallet.plus/fr/legal/terms"
                  >
                    3
                  </A>
                  <A target="_blank" href="https://policies.google.com/privacy">
                    5
                  </A>
                  <A target="_blank" href="https://policies.google.com/terms">
                    7
                  </A>
                  8
                </Trans>
              </p>
            </div>
          )}

          <div className="text-center mt-8">
            <Button
              loading={isLoading}
              onClick={() => requestMfa()}
              disabled={
                !/^\w+([.+-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(email) ||
                (!legalConsent && props.showLegal)
              }
            >
              Continue
              <ArrowRightIcon
                className="ml-2 -mr-0.5 h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          </div>
        </>
      )}
      {!success && !!challenge?.token && (
        <>
          <p className="text-center text-sm text-black dark:text-white my-8">
            An email has been sent to <b>{email}</b> with a verification code.
          </p>

          <InputCode
            onComplete={(code) => verifyMfa(code)}
            loading={isLoading}
          />

          {hasError && (
            <p className="text-center text-red-500 text-sm my-4">
              This code is invalid or expired, please try again.
            </p>
          )}

          <p className="text-center text-sm text-gray-400 my-8 mb-0">
            This code will be valid during 5 minutes.
            <br />
            {!isLoading && (hasError || hasTimeout) && (
              <A
                onClick={() => {
                  setChallenge(null);
                  setAutoRequest(false);
                }}
                className="text-sm"
              >
                Try again
              </A>
            )}
          </p>
          <br />
          <br />
        </>
      )}
      <Transition
        show={success}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <p className="text-center text-md text-black dark:text-white mt-12">
          <DelayedLoader />
          <br />
          <br />
          Your email was verified successfully.
          <br />
          <br />
        </p>
      </Transition>
    </>
  );
};
