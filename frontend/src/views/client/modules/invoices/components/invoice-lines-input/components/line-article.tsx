import { InputLabel } from "@atoms/input/input-decoration-label";
import Link from "@atoms/link";
import { RadioCard } from "@atoms/radio-card";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerType } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { useArticle } from "@features/articles/hooks/use-articles";
import { Articles } from "@features/articles/types/types";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { EditorInput } from "@molecules/editor-input";
import { useState } from "react";
import { getArticleIcon } from "../../../../articles/components/article-icon";
import { getCorrectPrice } from "../invoice-line-input";

export const InvoiceLineArticleInput = (props: {
  invoice: Invoices;
  article?: Articles | null;
  value?: InvoiceLine;
  onChange?: (v: InvoiceLine) => void;
  ctrl?: FormControllerType<InvoiceLine>;
  close?: () => void;
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
          title={"Article"}
          value={value.type !== "separation" && value.type !== "correction"}
          onClick={() =>
            onChange?.({ ...value, type: article?.type || "product" })
          }
        />
        <RadioCard
          title={"Texte libre"}
          value={value.type === "separation"}
          onClick={() =>
            onChange?.({ ...value, type: "separation", article: "" })
          }
        />
        <RadioCard
          title={"Acompte"}
          value={value.type === "correction"}
          onClick={() =>
            onChange?.({
              ...value,
              type: "correction",
              article: "",
              quantity: 1,
              tva: "0",
            })
          }
        />
      </div>

      <div className="space-y-2">
        {value.type !== "separation" && value.type !== "correction" && (
          <RestDocumentsInput
            size={"xl"}
            className="w-full"
            entity="articles"
            label="Choisir un article"
            icon={getArticleIcon(article?.type)}
            value={value.article}
            filter={
              props.invoice?.supplier
                ? ({
                    suppliers: [props.invoice.supplier],
                  } as Partial<Articles>)
                : {}
            }
            onChange={(id, article: Articles | null) => {
              onChange?.(
                article
                  ? {
                      ...value,
                      article: id as string,
                      type: article.type,
                      reference: article.internal_reference,
                      unit_price: getCorrectPrice(article, props.invoice),
                      unit: article.unit,
                      tva: article.tva,
                      name: article.name,
                      description: article.description,
                      quantity: value.quantity || 1,
                      subscription: article.subscription,
                    }
                  : { ...value, article: "" }
              );
              props.close?.();
            }}
          />
        )}

        {value.type === "separation" && (
          <>
            <FormInput
              size="md"
              autoFocus
              autoSelect
              label="Titre"
              value={value.name}
              onChange={(v) => onChange?.({ ...value, name: v })}
              className="mb-4"
            />
            <InputLabel
              label="Description"
              input={
                <>
                  <EditorInput
                    placeholder="Description"
                    value={value.description}
                    onChange={(description) =>
                      onChange?.({ ...value, description })
                    }
                  />
                </>
              }
            />
          </>
        )}

        {((value.type !== "separation" && !useArticleName) ||
          value.type === "correction") && (
          <>
            <FormInput
              size="md"
              autoFocus
              autoSelect
              label="Nom"
              value={value.name}
              onChange={(v) => onChange?.({ ...value, name: v })}
            />

            <EditorInput
              placeholder="Description"
              value={value.description}
              onChange={(description) => onChange?.({ ...value, description })}
            />

            {value.type !== "correction" && (
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
            )}
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
