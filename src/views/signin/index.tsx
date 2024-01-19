import SingleCenterCard from "@components/single-center-card/single-center-card";
import { useAuth } from "@features/auth/state/use-auth";
import { ROUTES } from "@features/routes";
import { ReactNode, useCallback, useEffect } from "react";
import { Route, useNavigate } from "react-router-dom";
import { Login } from "./login";
import { SignUp } from "./signup";
import { AnimatedBackground } from "@components/animated-background";

export const LoginRoutes = () => {
  return (
    <Route path={ROUTES.Login}>
      <Route
        path={ROUTES.SignUp}
        element={
          <PublicPage>
            <SignUp />
          </PublicPage>
        }
      />
      <Route
        path={""}
        element={
          <PublicPage>
            <Login />
          </PublicPage>
        }
      />
    </Route>
  );
};

const useRedirectToApp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const redirectToApp = useCallback(() => {
    setTimeout(() => {
      navigate(
        decodeURIComponent(
          new URL((window as any).document.location).searchParams.get("r") || ""
        ) || ROUTES.Home
      );
    }, 500);
  }, [navigate]);

  useEffect(() => {
    if (user?.id) redirectToApp();
  }, [user?.id, redirectToApp]);

  return { user };
};

const PublicPage = (props: { children: ReactNode }) => {
  const { user } = useRedirectToApp();

  if (user?.id) {
    return <></>;
  }

  return (
    <div className="h-full w-full absolute sm:bg-transparent">
      <SingleCenterCard insetLogo>{props.children}</SingleCenterCard>
      <AnimatedBackground />
    </div>
  );
};
