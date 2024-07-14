import Link from "@atoms/link";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerType } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { useArticle } from "@features/articles/hooks/use-articles";
import { Articles } from "@features/articles/types/types";
import { InvoiceLine } from "@features/invoices/types/types";
import { EditorInput } from "@molecules/editor-input";
import { useState } from "react";
import { getArticleIcon } from "../../../../articles/components/article-icon";
import { RadioCard } from "@atoms/radio-card";

export const InvoiceLineArticleInput = (props: {
  article?: Articles | null;
  value?: InvoiceLine;
  onChange?: (v: InvoiceLine) => void;
  ctrl?: FormControllerType<InvoiceLine>;
}) => {
  const value = props.ctrl?.value || props.value || ({} as InvoiceLine);
  const onChange = props.ctrl?.onChange || props.onChange;

  const { article } = useArticle(value.article || "");

  const [useArticleName, setUseArticleName] = useState(
    !article ||
      (value.name === article?.name &&
        value.description === article?.description)
  );

  return (
    <>
      <div className="space-x-2 mb-4 flex">
        <RadioCard
          title={"Article ou service"}
          value={value.type !== "separation"}
          onClick={() => onChange?.({ ...value, type: "product" })}
        />
        <RadioCard
          title={"Texte libre"}
          value={value.type === "separation"}
          onClick={() =>
            onChange?.({ ...value, type: "separation", article: "" })
          }
        />
      </div>

      <div className="space-y-2">
        {value.type !== "separation" && (
          <RestDocumentsInput
            size={useArticleName ? "xl" : "md"}
            className="w-full"
            entity="articles"
            label="Choisir un article"
            icon={getArticleIcon(article?.type)}
            value={value.article}
            onChange={(id, article: Articles | null) =>
              onChange?.(
                article
                  ? {
                      ...value,
                      article: id as string,
                      name: article.name,
                      description: article.description,
                      type: article.type,
                      tva: article.tva,
                      unit_price: article.price,
                      unit: article.unit || "unit",
                    }
                  : { ...value, article: "" }
              )
            }
          />
        )}

        {!useArticleName && (
          <>
            <FormInput
              autoFocus
              autoSelect
              label="Nom"
              value={value.name}
              onChange={(v) => onChange?.({ ...value, name: v })}
            />

            <EditorInput
              placeholder="Texte libre"
              value={value.description}
              onChange={(description) => onChange?.({ ...value, description })}
            />

            <Info>
              <Link
                onClick={() => {
                  onChange?.({
                    ...value,
                    name: article?.name,
                    description: article?.description,
                  });
                  setUseArticleName(true);
                }}
              >
                Utiliser le nom et la description de l'article
              </Link>
            </Info>
          </>
        )}

        {useArticleName && article && (
          <Info>
            <Link
              onClick={() => {
                setUseArticleName(false);
              }}
            >
              Modifier le nom / la description
            </Link>
          </Info>
        )}
      </div>
    </>
  );
};
