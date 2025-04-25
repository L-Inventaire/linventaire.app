import { Button } from "@atoms/button/button";
import { Input } from "@atoms/input/input-text";
import { AuthApiClient } from "@features/auth/api-client/api-client";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export const VerifyApp = (props: {
  isLoading: boolean;
  email: string;
  onComplete: (args: { email: string; token: string }) => void;
}) => {
  const [code, setCode] = useState("");
  const [hasCodeError, setHasCodeError] = useState(false);

  return (
    <>
      <p className="text-center text-sm text-black dark:text-white my-8">
        Enters the one time code for the <b>{props.email}</b> account.
      </p>
      <Input
        type="number"
        label="TOTP one time code"
        placeholder="123456"
        autoFocus
        onChange={(e) => {
          setCode(e.target.value);
          setHasCodeError(false);
        }}
      />
      <div className="text-center my-4">
        <Button
          shortcut={["enter"]}
          loading={props.isLoading}
          onClick={async () => {
            const { validation_token } = await AuthApiClient.verifyAppMFA(
              props.email,
              code
            );
            if (!validation_token) setHasCodeError(true);
            if (validation_token)
              props.onComplete({ token: validation_token, email: props.email });
          }}
        >
          Continuer
          <ArrowRightIcon className="ml-2 -mr-0.5 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {hasCodeError && (
        <p className="text-center text-red-500 text-sm my-4">
          Invalid password.
        </p>
      )}
    </>
  );
};
