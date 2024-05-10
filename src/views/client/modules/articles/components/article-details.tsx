import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { FormContext, useFormController } from "@components/form/formcontext";
import { PageLoader } from "@components/page-loader";
import { useArticle } from "@features/articles/hooks/use-articles";
import { Articles } from "@features/articles/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigationPrompt } from "@features/utils/use-navigation-prompt";
import { PageColumns } from "@views/client/_layout/page";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const ArticlesDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const navigate = useNavigate();
  const { client } = useClients();
  const { article: existingArticle, isPending, upsert } = useArticle(id);

  const [article, setArticle] = useState<Articles>({} as Articles);

  const { lockNavigation, ctrl, setLockNavigation } = useFormController(
    article,
    setArticle
  );
  useNavigationPrompt(!readonly && lockNavigation);

  useEffect(() => {
    if (existingArticle && (article.id !== existingArticle.id || readonly)) {
      setArticle(existingArticle);
    }
  }, [existingArticle]);

  const save = async () => {
    try {
      setLockNavigation(false);
      const narticle = await upsert.mutateAsync(article);
      navigate(getRoute(ROUTES.ProductsView, { id: narticle.id }));
    } catch (e) {
      setLockNavigation(true);
      console.error(e);
    }
  };

  if (isPending || (id && article.id !== id)) return <PageLoader />;

  return (
    <>
      <div className="float-right space-x-2">
        {!readonly && (
          <>
            <Button
              theme="outlined"
              onClick={async () =>
                navigate(
                  !id
                    ? getRoute(ROUTES.Products)
                    : getRoute(ROUTES.ProductsView, { id })
                )
              }
            >
              Annuler
            </Button>
            <Button
              disabled={!article.name}
              loading={upsert.isPending}
              onClick={async () => await save()}
            >
              Sauvegarder
            </Button>
          </>
        )}
        {readonly && (
          <Button
            onClick={async () =>
              navigate(getRoute(ROUTES.ProductsEdit, { id }))
            }
          >
            Modifier
          </Button>
        )}
      </div>
      {!readonly && !id && (
        <Title>Création de {article.name || "<nouveau>"}</Title>
      )}
      {!readonly && id && <Title>Modification de {article.name || ""}</Title>}
      {readonly && <Title>{article.name || ""}</Title>}
      <div className="mt-4" />
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow"></div>
          <div className="grow lg:max-w-xl"></div>
        </PageColumns>
      </FormContext>
    </>
  );
};
