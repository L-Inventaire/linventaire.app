import React from "react";
import { Text, View, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import Invoices from "../../entities/invoices";
import { convertHtml, formatAmount, formatNumber } from "./utils";
import Framework from "../../../../../platform";
import { Context } from "../../../../../types";
import { getTvaValue } from "../../utils";
import { formatQuantity } from "#src/services/utils";
import _ from "lodash";

export const InvoiceContent = ({
  ctx,
  as,
  document,
  colors,
  references,
}: {
  ctx: Context;
  document: Invoices;
  as: "proforma" | "receipt_acknowledgement" | "delivery_slip";
  colors: {
    primary: string;
    secondary: string;
    lightGray: string;
    gray: string;
  };
  references: { article: string; reference: string; line?: number }[];
}) => {
  const styles = StyleSheet.create({
    thead: {
      fontSize: 9,
      backgroundColor: colors.primary,
      color: "#FFFFFF",
      width: "10%",
      fontWeight: "bold",
      padding: 4,
      marginLeft: 1,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "flex-end",
    },
    td: {
      fontSize: 9,
      width: "10%",
      padding: 4,
      paddingTop: 6,
      paddingBottom: 6,
      marginLeft: 1,
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "flex-end",
    },
  });

  const quantityRowSize = getRowSize(
    document.content,
    (r) => formatNumber(r.quantity) + " " + r.unit,
    10,
    20
  );
  const unitPriceRowSize = getRowSize(
    document.content,
    (r) => formatAmount(r.unit_price, document.currency) + " TTC",
    12,
    20
  );
  const totalRowSize = getRowSize(
    document.content,
    (r) => formatAmount(r.unit_price * r.quantity, document.currency) + " TTC",
    12,
    20
  );

  let itemIndex = 1;

  const showInternalReferences =
    as === "delivery_slip" || (document.type === "quotes" && !as);

  // Make sure we don't display the same reference twice
  const usedReferences: string[] = [];
  const getReferences = (
    allReferences: { article: string; reference: string; line?: number }[],
    index: number,
    max?: number
  ) => {
    const availableLines = _.uniq(
      allReferences.filter((a) => _.isNumber(a)).map((a) => a.line)
    );
    const matchingLine = _.sortBy(availableLines, (a) =>
      Math.abs(a - index)
    )[0];
    let references = allReferences;
    if (_.isNumber(matchingLine)) {
      references = allReferences.filter((a) => matchingLine === a.line);
    }
    references = references
      .filter((a) => !usedReferences.includes(a.reference))
      .splice(0, _.isNumber(matchingLine) ? 10000 : max);
    references.forEach((a) => {
      if (!usedReferences.includes(a.reference)) {
        usedReferences.push(a.reference);
      }
    });
    return references;
  };

  return (
    <View style={{ marginBottom: 20, width: "100%" }}>
      <View style={{ flexDirection: "row", width: "100%" }}>
        <View
          style={{
            ...styles.thead,
            marginLeft: 0,
            borderTopLeftRadius: 4,
            borderBottomLeftRadius: 4,
            width: "5%",
            alignItems: "center",
          }}
        >
          <Text>#</Text>
        </View>
        <View
          style={{
            ...styles.thead,
            flexGrow: 1,
            alignItems: "flex-start",
          }}
        >
          <Text>{Framework.I18n.t(ctx, "invoices.content.description")}</Text>
        </View>
        <View style={{ ...styles.thead, width: quantityRowSize }}>
          <Text>{Framework.I18n.t(ctx, "invoices.content.quantity")}</Text>
        </View>
        {as !== "delivery_slip" && (
          <>
            <View style={{ ...styles.thead, width: unitPriceRowSize }}>
              <Text>
                {Framework.I18n.t(ctx, "invoices.content.unit_price")}
              </Text>
            </View>
            <View
              style={{
                ...styles.thead,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
                width: totalRowSize,
              }}
            >
              <Text>{Framework.I18n.t(ctx, "invoices.content.total")}</Text>
            </View>
          </>
        )}
      </View>

      {document.content.map((item, index) => (
        <View
          style={{
            borderBottomStyle: "solid",
            borderBottomColor: colors.lightGray,
            borderBottomWidth: 1,
            flexDirection: "row",
            marginTop: item.type === "separation" ? 8 : 0,
          }}
        >
          {!!["separation"].includes(item.type) && (
            <>
              <View
                style={{
                  ...styles.td,
                  marginLeft: 0,
                  width: "5%",
                }}
              ></View>
            </>
          )}
          {!["separation"].includes(item.type) && (
            <>
              <View
                style={{
                  ...styles.td,
                  marginLeft: 0,
                  width: "5%",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "bold" }}>{itemIndex++}</Text>
                {item.optional && (
                  <View
                    id={"optional_item_" + index}
                    style={{
                      marginTop: 4,
                      borderWidth: 1,
                      borderColor: item.optional_checked
                        ? colors.primary
                        : colors.gray,
                      backgroundColor: item.optional_checked
                        ? colors.primary
                        : undefined,
                      color: item.optional_checked ? "#FFFFFF" : undefined,
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      fontWeight: "bold",
                      position: "relative",
                    }}
                  >
                    {item.optional_checked && (
                      <Svg width="8" height="8" viewBox="0 0 24 24">
                        <Path
                          fill="#FFFFFF"
                          d="M0 12.116l2.053-1.897c2.401 1.162 3.924 2.045 6.622 3.969 5.073-5.757 8.426-8.678 14.657-12.555l.668 1.536c-5.139 4.484-8.902 9.479-14.321 19.198-3.343-3.936-5.574-6.446-9.679-10.251z"
                        />
                      </Svg>
                    )}
                    <Text
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        fontSize: 1,
                        opacity: 0,
                      }}
                    >
                      {`OPTION_${index}_HERE`}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
          <View
            style={{
              ...styles.td,
              flexGrow: 1,
              alignItems: "flex-start",
              textDecoration:
                !item.optional_checked && item.optional
                  ? "line-through"
                  : "none",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {showInternalReferences &&
                !!item.reference &&
                `[${item.reference}]`}{" "}
              {item.name}
            </Text>
            <View>{convertHtml(item.description, { color: colors.gray })}</View>
            {getReferences(
              references?.filter((a) => a.article === item.article),
              index + 1,
              item.quantity
            ).map((a) => (
              <Text style={{ color: colors.gray }}>{a?.reference}</Text>
            ))}
          </View>

          {!["separation", "correction"].includes(item.type) && (
            <View
              style={{
                ...styles.td,
                width: quantityRowSize,
                textDecoration:
                  !item.optional_checked && item.optional
                    ? "line-through"
                    : "none",
              }}
            >
              <Text>
                {formatQuantity(item.quantity, item.unit)} {item.unit || "u."}
              </Text>
              {!!item.subscription && (
                <Text
                  style={{
                    fontSize: 8,
                    padding: 2,
                    paddingLeft: 4,
                    paddingRight: 4,
                    borderRadius: 4,
                    backgroundColor: "#DDDDFF",
                    marginTop: 2,
                    marginRight: -4,
                  }}
                >
                  {Framework.I18n.t(
                    ctx,
                    "invoices.other.frequency." + item.subscription
                  )}
                </Text>
              )}
            </View>
          )}

          {!["separation", "correction"].includes(item.type) &&
            as !== "delivery_slip" && (
              <>
                <View
                  style={{
                    ...styles.td,
                    width: unitPriceRowSize,
                    textDecoration:
                      !item.optional_checked && item.optional
                        ? "line-through"
                        : "none",
                  }}
                >
                  <Text>
                    {formatAmount(item.unit_price, document.currency)}
                  </Text>
                  {!!getTvaValue(item.tva) && (
                    <Text style={{ fontSize: 8, opacity: 0.5 }}>
                      {formatAmount(
                        item.unit_price * (1 + getTvaValue(item.tva)),
                        document.currency
                      )}{" "}
                      {Framework.I18n.t(ctx, "invoices.content.ttc")}
                    </Text>
                  )}
                </View>
              </>
            )}
          {!["separation"].includes(item.type) && as !== "delivery_slip" && (
            <View
              style={{
                ...styles.td,
                width: totalRowSize,
                textDecoration:
                  !item.optional_checked && item.optional
                    ? "line-through"
                    : "none",
              }}
            >
              <Text>
                {formatAmount(
                  item.unit_price * item.quantity,
                  document.currency
                )}
              </Text>
              {!!getTvaValue(item.tva) && (
                <Text style={{ fontSize: 8, opacity: 0.5 }}>
                  {formatAmount(
                    item.unit_price *
                      item.quantity *
                      (1 + getTvaValue(item.tva)),
                    document.currency
                  )}
                  {" "}
                  {Framework.I18n.t(ctx, "invoices.content.ttc")}
                </Text>
              )}
              {!!item.discount?.value && (
                <>
                  <Text
                    style={{
                      fontSize: 8,
                      padding: 2,
                      paddingLeft: 4,
                      paddingRight: 4,
                      borderRadius: 4,
                      backgroundColor: "#FFDDDD",
                      marginTop: 4,
                    }}
                  >
                    -{" "}
                    {item.discount.mode === "amount"
                      ? formatAmount(item.discount.value, document.currency)
                      : item.discount.value + "%"}
                  </Text>
                  <Text style={{ fontSize: 8, opacity: 0.5 }}>
                    -{" "}
                    {formatAmount(
                      item.discount.mode === "amount"
                        ? item.discount.value
                        : (item.discount.value / 100) *
                            (item.unit_price *
                              item.quantity *
                              (1 + getTvaValue(item.tva))),
                      document.currency
                    )}
                    {" "}
                    {Framework.I18n.t(ctx, "invoices.content.ttc")}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

export const getRowSize = <T,>(
  rows: T[],
  accessor: (row: T) => string,
  min: number,
  max = 20
) => {
  const maxLength = rows.reduce((max, row) => {
    const value = accessor(row);
    return value.length > max ? value.length : max;
  }, 0);
  return Math.min(max, Math.max(min, (maxLength / 8) * 10)) + "%";
};
