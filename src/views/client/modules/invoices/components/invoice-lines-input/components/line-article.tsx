import Link from "@atoms/link";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerType } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { useArticle } from "@features/articles/hooks/use-articles";
import { Articles } from "@features/articles/types/types";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { EditorInput } from "@molecules/editor-input";
import { useEffect, useRef, useState } from "react";
import { getArticleIcon } from "../../../../articles/components/article-icon";
import { RadioCard } from "@atoms/radio-card";
import { InputLabel } from "@atoms/input/input-decoration-label";
import _ from "lodash";

export const InvoiceLineArticleInput = (props: {
  invoice: Invoices;
  article?: Articles | null;
  value?: InvoiceLine;
  onChange?: (v: InvoiceLine) => void;
  ctrl?: FormControllerType<InvoiceLine>;
}) => {
  const value = props.ctrl?.value || props.value || ({} as InvoiceLine);
  const onChange = props.ctrl?.onChange || props.onChange;

  const { article } = useArticle(value.article || "");
  const prevSupplier = useRef(props.invoice.supplier);

  const [useArticleName, setUseArticleName] = useState(
    !article ||
      (value.name === article?.name &&
        value.description === article?.description)
  );

  useEffect(() => {
    let supplierChanged = false;
    if (prevSupplier.current !== props.invoice.supplier) {
      prevSupplier.current = props.invoice.supplier;
      supplierChanged = true;
    }
    if (article) {
      let val = _.cloneDeep(value);
      if (supplierChanged) {
        val = _.pick(
          value,
          "_id",
          "article",
          "name",
          "description",
          "reference",
          "subscription",
          "optional",
          "optional_checked"
        ) as InvoiceLine;
      }

      if (
        [
          "supplier_quotes",
          "supplier_invoices",
          "supplier_credit_notes",
        ].includes(props.invoice.type)
      ) {
        val.optional = false;
      }

      onChange?.({
        ...val,
        name: val.name || article.name,
        description: val.description || article.description,
        type: article.type,
        tva: val.tva || article.tva,
        unit_price:
          val.unit_price ||
          (["quotes", "invoices", "credit_notes"].includes(props.invoice.type)
            ? article.price
            : article.suppliers_details[props.invoice.supplier]?.price ||
              article.price),
        unit:
          val.unit === "unit"
            ? article.unit
            : val.unit || article.unit || "unit",
      });
    }
  }, [article?.id, props.invoice?.supplier]);

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
                      type: article.type,
                      name: "",
                      description: "",
                      tva: "",
                      unit_price: 0,
                      unit: "",
                    }
                  : { ...value, article: "" }
              )
            }
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

        {value.type !== "separation" && !useArticleName && (
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
