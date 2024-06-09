import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { Navigate } from "react-router-dom";

export const DashboardHomePage = () => {
  return (
    <Page
      title={[
        {
          label: "Tableau de bord",
        },
      ]}
    >
      <Navigate to={getRoute(ROUTES.Contacts)} />
    </Page>
  );
};
