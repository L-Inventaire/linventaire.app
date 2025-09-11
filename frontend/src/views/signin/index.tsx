import { AnimatedBackground } from "@atoms/animated-background";
import SingleCenterCard from "@atoms/single-center-card/single-center-card";
import { useHasAccess } from "@features/access";
import { useAuth } from "@features/auth/state/use-auth";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";
import { ReactNode, useCallback, useEffect } from "react";
import { Route, useNavigate } from "react-router-dom";
import { Login } from "./login";
import { SignUp } from "./signup";

export const LoginRoutes = () => {
  return (
    <Route path={ROUTES.Login}>
      <Route
        path={ROUTES.SignUp}
        element={
          <LoggedOutPage>
            <SignUp />
          </LoggedOutPage>
        }
      />
      <Route
        path={""}
        element={
          <LoggedOutPage>
            <Login />
          </LoggedOutPage>
        }
      />
      <Route
        path={"*"}
        element={
          <LoggedOutPage>
            <Login />
          </LoggedOutPage>
        }
      />
    </Route>
  );
};

const useRedirectToApp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clients, loading } = useClients();
  const hasAccess = useHasAccess();

  const redirectToApp = useCallback(() => {
    if (clients?.[0]?.client?.id) {
      let bestClient = localStorage.getItem("client_id") as string;
      if (!bestClient || !clients.find((c) => c.client.id === bestClient)) {
        bestClient = clients[0].client.id;
        localStorage.setItem("client_id", bestClient);
      }
      // Check if we have a "redirect" query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect");
      if (redirect) navigate(redirect);
      else if (hasAccess("ACCOUNTING_READ"))
        navigate(getRoute(ROUTES.Home, { client: bestClient }));
      else if (hasAccess("INVOICES_READ"))
        navigate(getRoute(ROUTES.Invoices, { client: bestClient }));
      else if (hasAccess("ONSITE_SERVICES_READ"))
        navigate(getRoute(ROUTES.ServiceItems, { client: bestClient }));
      else navigate(getRoute(ROUTES.Contacts, { client: bestClient }));
    } else {
      navigate(ROUTES.JoinCompany);
    }
  }, [navigate, clients, loading]);

  useEffect(() => {
    if (user?.id && !loading) redirectToApp();
  }, [user?.id, loading]);

  return { user };
};

const LoggedOutPage = (props: { children: ReactNode }) => {
  const { user } = useRedirectToApp();

  useEffect(() => {
    if (user?.id) {
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://www.google.com/recaptcha/enterprise.js?render=6Lf5LxopAAAAALXErlTeGxlWy_x6M8RlKlJzZ4RB";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
