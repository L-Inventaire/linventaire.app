import React from "react";
import { Text, View, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import Invoices from "../../entities/invoices";
import { convertHtml, formatAmount, formatNumber } from "./utils";
import Framework from "../../../../../platform";
import { Context } from "../../../../../types";
import {
  computeGroupTotal,
  getGroupLines,
  getTvaValue,
} from "@shared/invoices";
import { formatQuantity } from "#src/services/utils";
import _ from "lodash";
import { getUnitCode, getUnitLabel } from "@shared/consts";

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
  console.log("[PDF] Rendering InvoiceContent");

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
    (r) =>
      formatNumber(r.quantity) +
      " " +
      getUnitLabel(getUnitCode(r.unit) || r.unit),
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

  // Groups of lines: numbering is "group.line" and each group ends with a subtotal
  const groupHeaders = _.keyBy(
    document.content.filter((a) => a.type === "group" && a.group),
    (a) => a.group
  );
  const groupNumbers: { [group: string]: number } = {};
  const groupCounters: { [group: string]: number } = {};
  const groupNumberCell = { alignItems: "flex-start" as const, paddingLeft: 6 };

  const renderGroupSubtotal = (group: Invoices["content"][0], index: number) => {
    const total = computeGroupTotal(getGroupLines(document.content, group.group));
    return (
      <View
        key={`content-group-total-${index}`}
        wrap={false}
        style={{
          flexDirection: "row",
          borderBottomStyle: "solid",
          borderBottomColor: colors.lightGray,
          borderBottomWidth: 1,
          marginBottom: 4,
        }}
      >
        <View style={{ ...styles.td, flexGrow: 1 }}>
          <Text style={{ fontWeight: "bold" }}>
            {Framework.I18n.t(ctx, "invoices.content.group_subtotal")}
          </Text>
        </View>
        {as !== "delivery_slip" && (
          <View style={{ ...styles.td, width: totalRowSize }}>
            <Text style={{ fontWeight: "bold" }}>
              {formatAmount(total.total, document.currency, 2)}
            </Text>
            {total.total_with_taxes !== total.total && (
              <Text style={{ fontSize: 8, opacity: 0.5 }}>
                {formatAmount(total.total_with_taxes, document.currency, 2)}{" "}
                {Framework.I18n.t(ctx, "invoices.content.ttc")}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const showInternalReferences =
    as === "delivery_slip" || (document.type === "quotes" && !as);

  // Make sure we don't display the same reference twice
  const usedReferences: string[] = [];
  const getReferences = (
    allReferences: { article: string; reference: string; line?: number }[],
    index: number,
    max?: number
  ) => {
    // Limit input array size to prevent performance issues
    if (allReferences.length > 10000) {
      console.warn(
        "Too many references, truncating from",
        allReferences.length,
        "to 10000"
      );
      allReferences = allReferences.slice(0, 10000);
    }

    const availableLines = _.uniq(
      allReferences.filter((a) => _.isNumber(a.line)).map((a) => a.line)
    );
    const matchingLine = _.sortBy(availableLines, (a) =>
      Math.abs((a || 0) - index)
    )[0];
    let references = allReferences;
    if (_.isNumber(matchingLine)) {
      references = allReferences.filter((a) => matchingLine === a.line);
    }
    // Reduce max limit from 10000 to 500
    references = references
      .filter((a) => !usedReferences.includes(a.reference))
      .splice(0, _.isNumber(matchingLine) ? 500 : max || 100);
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

      {document.content.map((item, index) => {
        if (item.type === "group") {
          groupNumbers[item.group] = itemIndex++;
          groupCounters[item.group] = 0;
          const isEmpty = !getGroupLines(document.content, item.group).length;
          return (
            <React.Fragment key={`content-group-${index}`}>
              <View
                wrap={false}
                style={{
                  flexDirection: "row",
                  marginTop: 8,
                  borderBottomStyle: "solid",
                  borderBottomColor: colors.lightGray,
                  borderBottomWidth: 1,
                }}
              >
                <View
                  style={{
                    ...styles.td,
                    ...groupNumberCell,
                    marginLeft: 0,
                    width: "5%",
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>
                    {groupNumbers[item.group]}
                  </Text>
                </View>
                <View
                  style={{ ...styles.td, flexGrow: 1, alignItems: "flex-start" }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 10 }}>
                    {item.name}
                  </Text>
                  {!!item.description && !!item.description.trim() && (
                    <View>
                      {convertHtml(item.description, { color: colors.gray })}
                    </View>
                  )}
                </View>
              </View>
              {isEmpty && renderGroupSubtotal(item, index)}
            </React.Fragment>
          );
        }

        const parentGroup =
          item.group && groupHeaders[item.group] && _.has(groupNumbers, item.group)
            ? groupHeaders[item.group]
            : undefined;
        const hidePrices = !!parentGroup?.group_hide_prices;
        const isLastOfGroup =
          !!parentGroup && document.content[index + 1]?.group !== item.group;
        const lineNumber =
          item.type === "separation"
            ? ""
            : parentGroup
            ? `${groupNumbers[item.group]}.${++groupCounters[item.group]}`
            : itemIndex++;

        const discountDisplay =
          item.discount.mode === "amount"
            ? formatAmount(item.discount.value, document.currency)
            : item.discount.value + "%";
        const discountValue =
          item.discount.mode === "amount"
            ? item.discount.value
            : (item.discount.value / 100) * (item.unit_price * item.quantity);
        return (
          <React.Fragment
            key={`content-${index}-${
              (item as any)._id || item.article || index
            }`}
          >
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
                    ...(parentGroup ? groupNumberCell : {}),
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
                    ...(parentGroup ? groupNumberCell : {}),
                  }}
                >
                  <Text style={{ fontWeight: parentGroup ? "normal" : "bold" }}>
                    {lineNumber}
                  </Text>
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
              {!!item.description && !!item.description.trim() && (
                <View>
                  {convertHtml(item.description, { color: colors.gray })}
                </View>
              )}
              {getReferences(
                references?.filter((a) => a.article === item.article),
                index + 1,
                item.quantity
              ).map((a, refIdx) => (
                <Text
                  key={`ref-${index}-${refIdx}-${a?.reference}`}
                  style={{ color: colors.gray }}
                >
                  {a?.reference}
                </Text>
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
                  {formatQuantity(item.quantity, item.unit)}{" "}
                  {getUnitLabel(item.unit) || "u."}
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
                    {!hidePrices && (
                      <Text>
                        {formatAmount(item.unit_price, document.currency)}
                      </Text>
                    )}
                    {!hidePrices && !!getTvaValue(item.tva) && (
                      <Text style={{ fontSize: 8, opacity: 0.5 }}>
                        {formatAmount(
                          item.unit_price * (1 + getTvaValue(item.tva)),
                          document.currency,
                          countDecimals(item.unit_price)
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
                {!hidePrices && (
                  <Text style={{ fontWeight: parentGroup ? "normal" : "bold" }}>
                    {formatAmount(
                      item.unit_price * item.quantity || 0,
                      document.currency,
                      2
                    )}
                  </Text>
                )}
                {!hidePrices && !!item.discount?.value && (
                  <>
                    <Text
                      style={{
                        fontSize: 8,
                        padding: 2,
                        paddingLeft: 4,
                        paddingRight: 4,
                        borderRadius: 4,
                        backgroundColor: "#FFDDDD",
                        marginBottom: 2,
                        marginTop: 2,
                      }}
                    >
                      - {discountDisplay}
                    </Text>
                  </>
                )}
                {!hidePrices && !!getTvaValue(item.tva) && (
                  <Text style={{ fontSize: 8, opacity: 0.5 }}>
                    {formatAmount(
                      (item.unit_price * item.quantity - discountValue) *
                        (1 + getTvaValue(item.tva)),
                      document.currency,
                      2
                    )}
                    {" "}
                    {Framework.I18n.t(ctx, "invoices.content.ttc")}
                  </Text>
                )}
              </View>
            )}
          </View>
          {isLastOfGroup && renderGroupSubtotal(parentGroup, index)}
          </React.Fragment>
        );
      })}
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

const countDecimals = function (value: number) {
  if (Math.floor(value) === value) return 0;
  return value.toString().split(".")[1].length || 0;
};
