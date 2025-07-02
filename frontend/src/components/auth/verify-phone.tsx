import { Button } from "@atoms/button/button";
import InputCode from "@atoms/input/input-code";
import InputPhone from "@atoms/input/input-phone";
import { Input } from "@atoms/input/input-text";
import A from "@atoms/link";
import { DelayedLoader } from "@atoms/loader";
import { AuthApiClient } from "@features/auth/api-client/api-client";
import { getCaptchaToken } from "@features/utils/captcha";
import { Transition } from "@headlessui/react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

let verifyPhoneTimeout: any = 0;

export const VerifyPhone = (props: {
  initialValue?: { phone: string };
  autoRequest?: boolean; //Will automatically send the email if email is already specified
  onComplete?: (args: { phone: string; token: string }) => void;
  onVerificationStatusChange?: (verification: boolean) => void;
  deviceDisabled?: boolean;
}) => {
  const [autoRequest, setAutoRequest] = useState(props.autoRequest);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasTimeout, setHasTimeout] = useState(false);
  const [phone, setPhone] = useState(props.initialValue?.phone || "");
  const [challenge, setChallenge] = useState<{
    expire: number;
    token: string;
  } | null>(null);

  useEffect(() => {
    props?.onVerificationStatusChange &&
      props?.onVerificationStatusChange(!!challenge);
  }, [challenge]);

  useEffect(() => {
    if (autoRequest && phone) requestMfa();
  }, [props.autoRequest]);

  //Clear interval on unmount
  useEffect(() => {
    return () => {
      clearTimeout(verifyPhoneTimeout);
    };
  }, []);

  const verifyMfa = async (code: string) => {
    setIsLoading(true);
    const data = await AuthApiClient.verifyPhoneMFA(
      challenge?.token || "",
      code
    );
    if (!data?.success) {
      setHasError(true);
    } else {
      setHasError(false);
      setSuccess(true);

      setTimeout(() => {
        props.onComplete?.({ phone, token: data.validation_token });
      }, 1000);
    }
    setIsLoading(false);
  };

  const requestMfa = async () => {
    if (!phone) {
      return;
    }
    clearTimeout(verifyPhoneTimeout);
    setHasTimeout(false);
    setIsLoading(true);
    const grecaptcha = (window as any).grecaptcha.enterprise;
    grecaptcha.ready(async () => {
      try {
        const captchaValidation = await getCaptchaToken("phone");

        const data = await AuthApiClient.requestPhoneMFA(
          phone,
          captchaValidation
        );
        if (data.success) {
          setChallenge(data);
          verifyPhoneTimeout = setTimeout(() => {
            setHasTimeout(true);
          }, 10000);
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
            label="Phone number"
            inputComponent={
              <InputPhone
                size="md"
                disabled={props.deviceDisabled}
                value={phone}
                onChange={(phone) => setPhone(phone + "")}
              />
            }
          />

          {hasError && (
            <p className="text-center text-red-500 text-sm my-4">
              An error occured. Please try with an other phone number.
            </p>
          )}

          <div className="text-center mt-8">
            <Button
              loading={isLoading}
              disabled={!/^\+?[0-9]{5,15}$/.test(phone)}
              onClick={() => requestMfa()}
            >
              Continuer
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
            An message has been sent to <b>{phone}</b> with a verification code.
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
          Your phone was verified successfully.
          <br />
          <br />
        </p>
      </Transition>
    </>
  );
};
