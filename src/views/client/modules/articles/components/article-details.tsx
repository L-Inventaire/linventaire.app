import { FormContext } from "@components/form/formcontext";
import { PageLoader } from "@components/page-loader";
import { Articles } from "@features/articles/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { PageColumns } from "@views/client/_layout/page";

export const ArticlesDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { draft: article, isPending } = useReadDraftRest<Articles>(
    "articles",
    id,
    readonly
  );

  if (isPending || (id && article.id !== id)) return <PageLoader />;

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow"></div>
          <div className="grow lg:max-w-xl"></div>
        </PageColumns>
      </FormContext>
    </>
  );
};
