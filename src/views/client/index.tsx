import { useAuth } from "@features/auth/state/use-auth";
import { ROUTES } from "@features/routes";
import { Modals } from "@views/modals";
import { Outlet, Route } from "react-router-dom";
import { Header } from "./_layout/header";
import { ChaussurePage } from "./chaussures";
import { DemoPage } from "./demo";
import { TabPage } from "./tableau";

export const BackOfficeRoutes = () => {
  return (
    <Route element={<Layout />}>
      <Route path={ROUTES.Demo} element={<DemoPage />} />
      <Route path={ROUTES.Tableau} element={<TabPage />} />
      <Route path={ROUTES.Chaussures} element={<ChaussurePage />} />
    </Route>
  );
};

export const Layout = () => {
  const { user, logout } = useAuth();

  if (!user?.id) {
    logout();
    return <></>;
  }

  return (
    <div className="flex w-full grow flex-col bg-slate-50 dark:bg-slate-900 h-full">
      <Header />
      <div className="grow flex min-h-0">
        <div className="grow min-h-0 overflow-auto">
          <Outlet />
        </div>
      </div>
      <Modals />
    </div>
  );
};
