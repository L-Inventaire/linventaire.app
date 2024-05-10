import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { ArticlesDetailsPage } from "../components/article-details";

export const ArticlesEditPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();

  return (
    <Page
      title={[
        { label: "Articles", to: getRoute(ROUTES.Products) },
        { label: "Créer" },
      ]}
    >
      <ArticlesDetailsPage readonly={false} id={id === "new" ? "" : id || ""} />
    </Page>
  );
};
