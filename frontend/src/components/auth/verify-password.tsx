import { Button } from "@atoms/button/button";
import { Input } from "@atoms/input/input-text";
import { AuthApiClient } from "@features/auth/api-client/api-client";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export const VerifyPassword = (props: {
  isLoading: boolean;
  email: string;
  onComplete: (args: { email: string; token: string }) => void;
}) => {
  const [password, setPassword] = useState("");
  const [hasPasswordError, setHasPasswordError] = useState(false);

  return (
    <>
      <p className="text-center text-sm text-black dark:text-white my-8">
        Enters the password for the <b>{props.email}</b> account.
      </p>
      <Input
        type="password"
        label="Account password"
        autoComplete="current-password"
        placeholder="••••••••"
        onChange={(e) => {
          setPassword(e.target.value);
          setHasPasswordError(false);
        }}
      />
      <div className="text-center my-4">
        <Button
          loading={props.isLoading}
          onClick={async () => {
            const { validation_token } = await AuthApiClient.verifyPasswordMFA(
              props.email,
              password
            );
            if (!validation_token) setHasPasswordError(true);
            if (validation_token)
              props.onComplete({ token: validation_token, email: props.email });
          }}
        >
          Continuer
          <ArrowRightIcon className="ml-2 -mr-0.5 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {hasPasswordError && (
        <p className="text-center text-red-500 text-sm my-4">
          Invalid password.
        </p>
      )}
    </>
  );
};
