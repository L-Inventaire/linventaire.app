import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Input } from "@atoms/input/input-text";
import { Section, Subtitle } from "@atoms/text";
import { PageLoader } from "@components/page-loader";
import { useAuth } from "@features/auth/state/use-auth";
import { useState } from "react";
import toast from "react-hot-toast";

export const SignUp = () => {
  const { loading: authLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div>
      {authLoading && <PageLoader />}
      {!authLoading && (
        <>
          <div className="text-center">
            <Section>Welcome back</Section>
            <Subtitle>Sign in to open back-office</Subtitle>
          </div>

          <InputLabel
            label="Email"
            className="mt-4"
            input={
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            }
          />
          <InputLabel
            label="Password"
            className="mt-4"
            input={
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            }
          />

          <div className="text-center mt-6">
            <Button
              size="lg"
              loading={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  if (await login(email, password)) {
                    toast.success("Logged in successfully");
                  } else {
                    toast.error("Failed to log in");
                  }
                } catch (e) {
                  toast.error("An error occured");
                }
                setLoading(false);
              }}
            >
              Sign in
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
